# Design Document

## Feature: GitHub Actions CI Pipeline (`github-actions-ci-pipeline`)

---

## Overview

This design describes the GitHub Actions CI pipeline for FOOD-DASH, a polyglot microservices application consisting of five services written in React/TypeScript, Python, Go, Java, and Node.js. The pipeline is triggered by SemVer Git tags (`v*.*.*`), builds Docker images for all five services, smoke-tests each image, and pushes tagged images to AWS ECR.

The pipeline is implemented as a single workflow file at `.github/workflows/ci.yml`. It uses a fan-out job topology: one shared version-resolution job feeds ten downstream jobs (five build+test jobs and five push jobs). Each service's build/test and push are visible as independent entries in the GitHub Actions UI.

The IAM configuration is documented as manual provisioning steps (not automated IaC), matching the project's current infrastructure approach.

---

## Architecture

### High-Level Pipeline Flow

```mermaid
flowchart TD
    A[Git tag push: v*.*.*] --> B[resolve-version job]
    B --> C1[build-test-frontend]
    B --> C2[build-test-menu-service]
    B --> C3[build-test-order-service]
    B --> C4[build-test-delivery-service]
    B --> C5[build-test-restaurant-service]
    C1 --> D1[push-frontend]
    C2 --> D2[push-menu-service]
    C3 --> D3[push-order-service]
    C4 --> D4[push-delivery-service]
    C5 --> D5[push-restaurant-service]
```

### Job Dependency Structure

```
resolve-version (outputs: semver)
  └─► build-test-{service}   (5 parallel jobs, independent of each other)
        └─► push-{service}   (5 parallel push jobs, each depends only on its own build-test job)
```

All jobs run on `ubuntu-latest`. The five build-test jobs run in parallel with no inter-service dependencies. Each push job depends only on its corresponding build-test job, so a failure in one service does not block any other service from building, testing, or pushing.

### Trigger and Guard

The workflow trigger is `on: push: tags: ['v[0-9]+.[0-9]+.[0-9]+']`. An additional guard step in `resolve-version` validates the extracted version string against `^[0-9]+\.[0-9]+\.[0-9]+$` and exits non-zero if the value is empty or malformed, providing an explicit error message.

---

## Components and Interfaces

### 1. `resolve-version` Job

**Purpose:** Extract and validate the SemVer string from the triggering Git tag, then expose it as a job output consumed by all downstream jobs.

**Steps:**
1. Strip the `v` prefix: `VERSION="${GITHUB_REF_NAME#v}"`
2. Validate against `^[0-9]+\.[0-9]+\.[0-9]+$` — fail fast with an error if invalid.
3. Set output: `echo "semver=$VERSION" >> $GITHUB_OUTPUT`

**Output consumed by all downstream jobs via:** `needs.resolve-version.outputs.semver`

---

### 2. `build-test-{service}` Jobs (×5)

Each of the five build-test jobs follows the same structure:

| Step | Action |
|------|--------|
| Checkout | `actions/checkout@v4` |
| Build image | `docker build -t food-dash/<service-name>:ci ./<service-dir>` |
| Smoke test | `docker run --rm -d --name test-<service> [env-flags] food-dash/<service-name>:ci` |
| Wait | `sleep 120` |
| Stop container | `docker stop test-<service>` |
| Check exit code | Assert exit code is 0, 130, or 143 |

**Service-specific Docker contexts and smoke-test environment variables:**

| Service | Context | Dockerfile | Smoke-test env vars |
|---------|---------|------------|---------------------|
| `frontend` | `./frontend` | `./frontend/Dockerfile` | _(none required)_ |
| `menu-service` | `./menu-service` | `./menu-service/Dockerfile` | `DATABASE_URL=postgresql://mock:mock@mock:5432/mock` |
| `order-service` | `./order-service` | `./order-service/Dockerfile` | `MYSQL_DSN=mock:mock@tcp(mock:3306)/mock` |
| `delivery-service` | `./delivery-service` | `./delivery-service/Dockerfile` | `SERVER_PORT=3004` |
| `restaurant-service` | `./restaurant-service` | `./restaurant-service/Dockerfile` | `MONGO_URI=mongodb+srv://mock-user:mock-password@cluster/mock` |

**Exit code handling:** `docker stop` sends `SIGTERM` (exit 143). The pipeline captures the container's exit code via `docker wait` after stopping, then checks it is in `{0, 130, 143}`. Any other code marks the job failed and skips the corresponding push job.

---

### 3. `push-{service}` Jobs (×5)

Each push job depends on its corresponding `build-test-{service}` job.

**Steps:**
1. **Validate secrets** — Check that `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ECR_REGISTRY` are all non-empty. Emit a specific error identifying any missing secret and exit non-zero before any AWS call.
2. **Checkout** — `actions/checkout@v4` (needed to re-build the image; GitHub Actions does not share Docker images between jobs by default).
3. **Re-build image** — Same `docker build` command as the build-test job. Docker layer caching on the runner minimizes redundant work.
4. **Authenticate to ECR** — `aws-actions/amazon-ecr-login@v2`, with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` injected from GitHub Secrets.
5. **Tag image** — Apply both `$SEMVER` and `latest` tags:
   ```
   docker tag food-dash/<service>:ci $ECR_REGISTRY/food-dash/<service>:$SEMVER
   docker tag food-dash/<service>:ci $ECR_REGISTRY/food-dash/<service>:latest
   ```
6. **Push both tags** — Push `$SEMVER` first, then `latest`. Failure of either push marks the job failed.

> **Note on image sharing between jobs:** GitHub Actions jobs run on separate ephemeral runners and do not share a Docker image cache. The push jobs therefore re-build the image. This is acceptable for this project's scale and avoids the complexity of Docker image export/artifact upload (which adds significant workflow complexity and storage costs). If build times become a concern, Docker layer caching via `actions/cache` targeting `/tmp/.buildx-cache` is the recommended evolution.

---

### 4. Secrets Validation Step

Before any AWS API call is made, the push jobs run an explicit validation step:

```bash
MISSING=""
[ -z "$AWS_ACCESS_KEY_ID" ]     && MISSING="$MISSING AWS_ACCESS_KEY_ID"
[ -z "$AWS_SECRET_ACCESS_KEY" ] && MISSING="$MISSING AWS_SECRET_ACCESS_KEY"
[ -z "$AWS_REGION" ]            && MISSING="$MISSING AWS_REGION"
[ -z "$AWS_ECR_REGISTRY" ]      && MISSING="$MISSING AWS_ECR_REGISTRY"
if [ -n "$MISSING" ]; then
  echo "::error::Missing required secrets:$MISSING"
  exit 1
fi
```

GitHub Actions automatically masks secret values in logs. The workflow never echoes secret values explicitly. The `::error::` annotation surfaces the error clearly in the GitHub Actions UI without revealing any secret content.

---

### 5. IAM User (`food-dash-ci-ecr-user`)

The IAM user is a pre-provisioned, manually managed resource. The pipeline consumes its credentials via GitHub Secrets and does not create or modify IAM resources at runtime.

**Required IAM policy (customer-managed, attached to the user):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuthToken",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "ECRRepositoryAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:<region>:<account-id>:repository/food-dash/*"
    }
  ]
}
```

This policy grants only what is needed to authenticate to ECR and push images to the `food-dash/*` namespace. All other AWS actions are implicitly denied.

**Provisioning steps (manual, one-time):**
1. Create IAM user `food-dash-ci-ecr-user` with no console access.
2. Create the customer-managed policy above (with real `<region>` and `<account-id>` substituted).
3. Attach the policy to the user.
4. Generate a programmatic access key pair; copy both values.
5. Store `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ECR_REGISTRY` as GitHub repository secrets.
6. Verify no other policies (AWS-managed or inline) are attached to the user.

---

## Data Models

### Workflow Inputs and Outputs

| Name | Source | Type | Description |
|------|--------|------|-------------|
| `GITHUB_REF_NAME` | GitHub runtime | string | The full tag name, e.g. `v1.4.2` |
| `semver` | `resolve-version` job output | string | Stripped version, e.g. `1.4.2` |
| `AWS_ACCESS_KEY_ID` | GitHub Secret | string | IAM access key ID |
| `AWS_SECRET_ACCESS_KEY` | GitHub Secret | string (masked) | IAM secret access key |
| `AWS_REGION` | GitHub Secret | string | AWS region, e.g. `us-east-1` |
| `AWS_ECR_REGISTRY` | GitHub Secret | string | ECR registry URI, e.g. `123456789.dkr.ecr.us-east-1.amazonaws.com` |

### ECR Repository Naming

| Service | ECR Repository |
|---------|---------------|
| `frontend` | `food-dash/frontend` |
| `menu-service` | `food-dash/menu-service` |
| `order-service` | `food-dash/order-service` |
| `delivery-service` | `food-dash/delivery-service` |
| `restaurant-service` | `food-dash/restaurant-service` |

### Image Tag Matrix

For a release tagged `v1.4.2`:

| Image | Tags applied |
|-------|-------------|
| `$ECR_REGISTRY/food-dash/frontend` | `1.4.2`, `latest` |
| `$ECR_REGISTRY/food-dash/menu-service` | `1.4.2`, `latest` |
| `$ECR_REGISTRY/food-dash/order-service` | `1.4.2`, `latest` |
| `$ECR_REGISTRY/food-dash/delivery-service` | `1.4.2`, `latest` |
| `$ECR_REGISTRY/food-dash/restaurant-service` | `1.4.2`, `latest` |

---

## Error Handling

| Failure Scenario | Detection | Pipeline Behaviour |
|-----------------|-----------|-------------------|
| Malformed Git tag (e.g. `v1.2`) | `resolve-version` regex check fails | Workflow fails immediately; no build/test/push runs |
| Non-tag push (branch push slipping past trigger filter) | Trigger pattern `v[0-9]+.[0-9]+.[0-9]+` does not match | Workflow does not start at all |
| Docker build fails for a service | `docker build` exits non-zero | That service's build-test job fails; push job is skipped; other services unaffected |
| Smoke-test container exits with unexpected code | Exit code check returns non-zero | Build-test job fails; push job skipped; other services unaffected |
| Missing GitHub Secret | Explicit validation step before AWS call | Push job fails with named secret in error message; no AWS API call made |
| ECR authentication failure | `aws-actions/amazon-ecr-login` step fails | All five push jobs fail (shared auth step); no images pushed |
| ECR repository does not exist | `docker push` returns 404/repository-not-found | That service's push job fails with ECR error; other push jobs unaffected |
| SemVer tag push succeeds but `latest` tag push fails | Second `docker push` command exits non-zero | Push job fails; partial state (SemVer tag exists, `latest` does not) is surfaced as a job failure |
| One service's build-test job fails | Job exit non-zero | Other four services' build-test and push jobs continue independently |

---

## Testing Strategy

This feature is a GitHub Actions CI pipeline defined in YAML workflow files, supplemented by IAM policy JSON. It is declarative configuration, not application logic. Property-based testing is not applicable — there are no pure functions, no input/output transformations, and no business logic to verify with random data generation.

The appropriate testing strategies are:

### 1. YAML Schema Validation (Static Analysis)

- Validate `.github/workflows/ci.yml` against the GitHub Actions workflow JSON schema using a linter such as [actionlint](https://github.com/rhymond/actionlint) or the VS Code GitHub Actions extension.
- This catches syntax errors, invalid action references, and incorrect `needs`/`outputs` wiring before a commit is pushed.
- Run as a pre-commit hook or local `make lint` target.

### 2. Dry-Run / Act Local Testing

- Use [nektos/act](https://github.com/nektos/act) to simulate the workflow locally with a mock tag push event.
- Confirm that job topology (fan-out, dependencies) behaves as designed.
- Confirm secrets validation rejects runs with missing environment variables.

### 3. Integration Smoke Tests (on real GitHub Actions)

These are one-shot integration tests run manually or on a dedicated test branch:

| Test | What to verify |
|------|---------------|
| Push a valid tag (e.g. `v0.0.1-test`) | All 11 jobs (resolve + 5 build-test + 5 push) complete successfully; images appear in ECR with correct tags |
| Push a malformed tag (e.g. `vbad`) | `resolve-version` job fails; no downstream jobs run |
| Remove a GitHub Secret temporarily | Push job fails with named-secret error message before any AWS call |
| Introduce a deliberate Dockerfile syntax error | Only the affected service's build-test job fails; other four succeed |
| Point a service at a non-existent ECR repo | Only that service's push job fails with an ECR error |

### 4. IAM Policy Verification

- Use AWS IAM Policy Simulator or `aws iam simulate-principal-policy` to confirm:
  - All eight required ECR actions are allowed on `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*`
  - `ecr:GetAuthorizationToken` is allowed on `*`
  - Any action outside the allow list (e.g. `s3:GetObject`, `iam:CreateUser`) returns `AccessDenied`
- This is a one-time setup verification, not a recurring automated test.
