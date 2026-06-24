# Implementation Plan: GitHub Actions CI Pipeline

## Overview

Create a single GitHub Actions workflow file at `.github/workflows/ci.yml` implementing an 11-job topology: one `resolve-version` job feeding five parallel `build-test-{service}` jobs, each feeding its own `push-{service}` job. The workflow triggers on SemVer Git tags, builds and smoke-tests Docker images, and pushes dual-tagged images to AWS ECR. IAM provisioning is documented as a one-time manual setup guide in a separate markdown file.

## Tasks

- [x] 1. Create the workflow directory and scaffold the workflow file
  - Create `.github/workflows/` directory if it does not exist
  - Create `.github/workflows/ci.yml` with the top-level `name`, `on` trigger (`push: tags: ['v[0-9]+.[0-9]+.[0-9]+']`), and an empty `jobs:` block
  - _Requirements: 8.1_

- [x] 2. Implement the `resolve-version` job
  - [x] 2.1 Add the `resolve-version` job with `runs-on: ubuntu-latest`
    - Strip `v` prefix from `GITHUB_REF_NAME` using bash parameter expansion: `VERSION="${GITHUB_REF_NAME#v}"`
    - Validate the result against `^[0-9]+\.[0-9]+\.[0-9]+$`; if empty or non-matching, emit `echo "::error::Malformed tag: $GITHUB_REF_NAME"` and `exit 1`
    - Write `echo "semver=$VERSION" >> $GITHUB_OUTPUT` to expose the output
    - Declare `outputs: semver: ${{ steps.set-version.outputs.semver }}` on the job
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement the five `build-test-{service}` jobs
  - [x] 3.1 Add `build-test-frontend` job
    - Set `needs: resolve-version` and `runs-on: ubuntu-latest`
    - Step 1: `actions/checkout@v4`
    - Step 2: `docker build -t food-dash/frontend:ci ./frontend`
    - Step 3: `docker run --rm -d --name test-frontend food-dash/frontend:ci`
    - Step 4: `sleep 120`
    - Step 5: `docker stop test-frontend`; capture exit code via `docker wait test-frontend` before stop; assert code is in `{0, 130, 143}`
    - _Requirements: 2.1, 2.2, 3.1, 8.2, 8.3, 8.4_
  - [x] 3.2 Add `build-test-menu-service` job
    - Set `needs: resolve-version` and `runs-on: ubuntu-latest`
    - Step 1: `actions/checkout@v4`
    - Step 2: `docker build -t food-dash/menu-service:ci ./menu-service`
    - Step 3: `docker run --rm -d --name test-menu-service -e DATABASE_URL=postgresql://mock:mock@mock:5432/mock food-dash/menu-service:ci`
    - Step 4: `sleep 120`
    - Step 5: Stop and check exit code in `{0, 130, 143}`
    - _Requirements: 2.1, 2.3, 3.1, 3.3, 8.2, 8.3, 8.4_
  - [x] 3.3 Add `build-test-order-service` job
    - Set `needs: resolve-version` and `runs-on: ubuntu-latest`
    - Step 1: `actions/checkout@v4`
    - Step 2: `docker build -t food-dash/order-service:ci ./order-service`
    - Step 3: `docker run --rm -d --name test-order-service -e MYSQL_DSN=mock:mock@tcp(mock:3306)/mock food-dash/order-service:ci`
    - Step 4: `sleep 120`
    - Step 5: Stop and check exit code in `{0, 130, 143}`
    - _Requirements: 2.1, 2.4, 3.1, 3.4, 8.2, 8.3, 8.4_
  - [x] 3.4 Add `build-test-delivery-service` job
    - Set `needs: resolve-version` and `runs-on: ubuntu-latest`
    - Step 1: `actions/checkout@v4`
    - Step 2: `docker build -t food-dash/delivery-service:ci ./delivery-service`
    - Step 3: `docker run --rm -d --name test-delivery-service -e SERVER_PORT=3004 food-dash/delivery-service:ci`
    - Step 4: `sleep 120`
    - Step 5: Stop and check exit code in `{0, 130, 143}`
    - _Requirements: 2.1, 2.5, 3.1, 3.2, 8.2, 8.3, 8.4_
  - [x] 3.5 Add `build-test-restaurant-service` job
    - Set `needs: resolve-version` and `runs-on: ubuntu-latest`
    - Step 1: `actions/checkout@v4`
    - Step 2: `docker build -t food-dash/restaurant-service:ci ./restaurant-service`
    - Step 3: `docker run --rm -d --name test-restaurant-service -e MONGO_URI=mongodb+srv://mock-user:mock-password@cluster/mock food-dash/restaurant-service:ci`
    - Step 4: `sleep 120`
    - Step 5: Stop and check exit code in `{0, 130, 143}`
    - _Requirements: 2.1, 2.6, 3.1, 3.5, 8.2, 8.3, 8.4_

- [x] 4. Checkpoint — Validate the workflow structure so far
  - Ensure all jobs have correct `needs`, correct `runs-on`, and correct docker build/run commands
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the five `push-{service}` jobs
  - [x] 5.1 Add `push-frontend` job
    - Set `needs: build-test-frontend` and `runs-on: ubuntu-latest`
    - Step 1: Secrets pre-flight validation — check `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ECR_REGISTRY` are all non-empty; emit `::error::` with the missing secret name and `exit 1` before any AWS call
    - Step 2: `actions/checkout@v4`
    - Step 3: Re-build `docker build -t food-dash/frontend:ci ./frontend`
    - Step 4: `aws-actions/amazon-ecr-login@v2` with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` from secrets
    - Step 5: Tag with SemVer: `docker tag food-dash/frontend:ci ${{ secrets.AWS_ECR_REGISTRY }}/food-dash/frontend:$SEMVER`
    - Step 6: Tag with latest: `docker tag food-dash/frontend:ci ${{ secrets.AWS_ECR_REGISTRY }}/food-dash/frontend:latest`
    - Step 7: Push SemVer tag, then push `latest` tag; failure of either marks job failed
    - Thread `semver` value from `needs.resolve-version.outputs.semver`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5_
  - [x] 5.2 Add `push-menu-service` job
    - Same structure as `push-frontend` but `needs: build-test-menu-service`
    - Re-build from `./menu-service`, tag and push to `food-dash/menu-service`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5_
  - [x] 5.3 Add `push-order-service` job
    - Same structure as `push-frontend` but `needs: build-test-order-service`
    - Re-build from `./order-service`, tag and push to `food-dash/order-service`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5_
  - [x] 5.4 Add `push-delivery-service` job
    - Same structure as `push-frontend` but `needs: build-test-delivery-service`
    - Re-build from `./delivery-service`, tag and push to `food-dash/delivery-service`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5_
  - [x] 5.5 Add `push-restaurant-service` job
    - Same structure as `push-frontend` but `needs: build-test-restaurant-service`
    - Re-build from `./restaurant-service`, tag and push to `food-dash/restaurant-service`
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.5_

- [x] 6. Checkpoint — Validate the complete workflow file
  - Run `actionlint .github/workflows/ci.yml` (or equivalent YAML schema linter) to confirm there are no syntax errors, invalid action references, or broken `needs`/`outputs` wiring
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create the IAM provisioning guide
  - [x] 7.1 Create `.github/iam-setup.md` documenting the one-time manual AWS setup
    - Document creation of IAM user `food-dash-ci-ecr-user` (programmatic access only, no console)
    - Include the complete customer-managed policy JSON with two statements: `ECRAuthToken` (`ecr:GetAuthorizationToken` on `"Resource": "*"`) and `ECRRepositoryAccess` (7 repo actions on `"Resource": "arn:aws:ecr:<region>:<account-id>:repository/food-dash/*"`)
    - Document attaching only this policy to the user (no AWS-managed or inline policies)
    - Document generating an access key pair and storing all four values as GitHub repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ECR_REGISTRY`
    - Document verification step: use AWS IAM Policy Simulator to confirm the 8 allowed actions pass and all other actions return `AccessDenied`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Final checkpoint — End-to-end review
  - Verify all 11 jobs are present in `ci.yml`: `resolve-version`, `build-test-frontend`, `build-test-menu-service`, `build-test-order-service`, `build-test-delivery-service`, `build-test-restaurant-service`, `push-frontend`, `push-menu-service`, `push-order-service`, `push-delivery-service`, `push-restaurant-service`
  - Verify every `push-*` job has both the secrets pre-flight step and re-build step before the ECR login step
  - Verify `semver` output propagates correctly through all 10 downstream jobs
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- The design explicitly states property-based testing is not applicable for this feature (declarative YAML/IaC). No property test sub-tasks are included.
- The five `push-*` jobs re-build their Docker image rather than sharing artifacts between jobs; this is intentional per the design — GitHub Actions jobs run on separate ephemeral runners.
- The secrets pre-flight step (task 5.x, Step 1) must run before `aws-actions/amazon-ecr-login@v2` to satisfy requirements 7.5 and 7.6.
- The smoke-test exit code check should use `docker wait` to capture the container's own exit code, not the exit code of `docker stop`, since `docker stop` always exits 0.
- All jobs must use `runs-on: ubuntu-latest` per requirement 8.3.
- ECR repositories (`food-dash/*`) must be pre-created manually; the pipeline will not auto-create them (requirement 4.4).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 3, "tasks": ["7.1"] }
  ]
}
```
