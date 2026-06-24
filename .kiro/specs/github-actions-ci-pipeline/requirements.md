# Requirements Document

## Introduction

This feature adds a GitHub Actions CI pipeline to the FOOD-DASH polyglot microservices project. The pipeline builds Docker images for all five services (frontend, menu-service, order-service, delivery-service, restaurant-service), validates each image after build, pushes them to AWS Elastic Container Registry (ECR) with SemVer tags derived from Git tags, and manages AWS credentials through a dedicated least-privilege IAM user. Workflow files are placed under `.github/workflows/`.

## Glossary

- **Pipeline**: The GitHub Actions CI workflow defined in `.github/workflows/`.
- **CI_Pipeline**: The GitHub Actions workflow responsible for orchestrating build, test, and push jobs.
- **Image_Builder**: The GitHub Actions job step responsible for building a Docker image for a given service.
- **Image_Tester**: The GitHub Actions job step responsible for running a smoke-test container against a built Docker image.
- **ECR_Publisher**: The GitHub Actions job step responsible for authenticating to AWS ECR and pushing a tagged image.
- **IAM_Provisioner**: The AWS IAM user and associated policy granting only the ECR permissions required by the pipeline.
- **Version_Resolver**: The pipeline step that derives a SemVer version string from a Git tag.
- **Service**: One of the five FOOD-DASH microservices — `frontend`, `menu-service`, `order-service`, `delivery-service`, or `restaurant-service`.
- **SemVer**: Semantic Versioning in the format `MAJOR.MINOR.PATCH` as defined at semver.org (e.g., `1.4.2`).
- **ECR_Registry**: The AWS ECR private registry that stores Docker images for FOOD-DASH services.
- **Git_Tag**: A Git tag in the format `v<MAJOR>.<MINOR>.<PATCH>` (e.g., `v1.4.2`) used to trigger a release build.
- **GitHub_Secret**: An encrypted repository-level secret stored in GitHub Actions, used to supply credentials to the pipeline at runtime.
- **Least_Privilege**: The IAM security principle where a user is granted only the minimum permissions necessary to perform its required actions and nothing more.

---

## Requirements

### Requirement 1: Pipeline Trigger and Version Resolution

**User Story:** As a maintainer, I want the pipeline to trigger automatically on Git tags that follow SemVer format, so that every release produces versioned Docker images without manual intervention.

#### Acceptance Criteria

1. WHEN a Git tag matching the pattern `v[0-9]+\.[0-9]+\.[0-9]+` is pushed to the repository, THE CI_Pipeline SHALL start a workflow run.
2. WHEN the pipeline is triggered by a Git tag, THE Version_Resolver SHALL extract the SemVer string by stripping the leading `v` prefix from the tag name (e.g., tag `v1.4.2` produces version `1.4.2`).
3. WHEN a Git tag is pushed, THE CI_Pipeline SHALL expose the resolved SemVer string as a named job output accessible to all downstream build and push jobs within the same workflow run.
4. IF the Version_Resolver produces an empty string or a string that does not match `[0-9]+\.[0-9]+\.[0-9]+` after stripping the `v` prefix, THEN THE CI_Pipeline SHALL fail immediately with an error identifying the malformed tag value.
5. IF the triggering ref is not a tag conforming to the `v[0-9]+\.[0-9]+\.[0-9]+` pattern, THEN THE CI_Pipeline SHALL complete without executing any build, test, or push steps and without reporting an error.

---

### Requirement 2: Docker Image Build

**User Story:** As a developer, I want all five service Docker images to be built as part of every tagged release, so that the images in ECR always reflect the current state of each service.

#### Acceptance Criteria

1. WHEN a pipeline run is triggered, THE Image_Builder SHALL build a Docker image for each of the five Services using the Dockerfile located in each Service's root directory.
2. WHEN building the `frontend` image, THE Image_Builder SHALL use `./frontend` as the Docker build context and `./frontend/Dockerfile` as the Dockerfile path.
3. WHEN building the `menu-service` image, THE Image_Builder SHALL use `./menu-service` as the Docker build context and `./menu-service/Dockerfile` as the Dockerfile path.
4. WHEN building the `order-service` image, THE Image_Builder SHALL use `./order-service` as the Docker build context and `./order-service/Dockerfile` as the Dockerfile path.
5. WHEN building the `delivery-service` image, THE Image_Builder SHALL use `./delivery-service` as the Docker build context and `./delivery-service/Dockerfile` as the Dockerfile path.
6. WHEN building the `restaurant-service` image, THE Image_Builder SHALL use `./restaurant-service` as the Docker build context and `./restaurant-service/Dockerfile` as the Dockerfile path.
7. WHEN a Docker build step fails for any Service, THE CI_Pipeline SHALL mark that Service's job as failed, SHALL stop all subsequent steps within that Service's job, and SHALL not proceed to the test or push steps for that Service.

---

### Requirement 3: Docker Image Testing

**User Story:** As a developer, I want each Docker image to be validated after it is built, so that broken images are caught before being pushed to ECR.

#### Acceptance Criteria

1. WHEN a Docker image has been successfully built for a Service, THE Image_Tester SHALL start a container from that image, wait 120 seconds, force-stop the container, and treat exit codes 0, 130 (SIGINT), and 143 (SIGTERM) as a passing result.
2. WHEN the Image_Tester runs the container for `delivery-service`, THE Image_Tester SHALL pass the environment variable `SERVER_PORT=3004` to the container to satisfy the Spring Boot startup requirement.
3. WHEN the Image_Tester runs the container for `menu-service`, THE Image_Tester SHALL pass the environment variable `DATABASE_URL=postgresql://mock:mock@mock:5432/mock` to the container to trigger mock/fallback mode.
4. WHEN the Image_Tester runs the container for `order-service`, THE Image_Tester SHALL pass the environment variable `MYSQL_DSN=mock:mock@tcp(mock:3306)/mock` to the container to trigger mock/fallback mode.
5. WHEN the Image_Tester runs the container for `restaurant-service`, THE Image_Tester SHALL pass the environment variable `MONGO_URI=mongodb+srv://mock-user:mock-password@cluster/mock` to the container to trigger mock/fallback mode.
6. IF the container exits with any code other than 0, 130, or 143, THEN THE CI_Pipeline SHALL mark that Service's job as failed and SHALL not push that Service's image to ECR.

---

### Requirement 4: Docker Image Tagging Strategy

**User Story:** As an operator, I want every pushed image to be tagged with both its exact SemVer version and `latest`, so that deployments can pin to a specific version or track the most recent release.

#### Acceptance Criteria

1. WHEN the ECR_Publisher pushes an image for a Service, THE ECR_Publisher SHALL apply the resolved SemVer string (e.g., `1.4.2`) as a tag to the image, overwriting any existing image in ECR that carries the same SemVer tag.
2. WHEN the ECR_Publisher pushes an image for a Service, THE ECR_Publisher SHALL also apply the tag `latest` to the same image digest, overwriting any existing `latest` tag.
3. THE ECR_Publisher SHALL name each image repository in ECR using the pattern `food-dash/<service-name>` (e.g., `food-dash/frontend`, `food-dash/menu-service`).
4. IF the ECR repository for a Service does not exist at push time, THEN THE CI_Pipeline SHALL fail that Service's push step with an error identifying the missing repository name; THE CI_Pipeline SHALL not attempt to auto-create the repository.
5. IF applying the SemVer tag succeeds but applying the `latest` tag fails for a Service, THEN THE CI_Pipeline SHALL mark that Service's push step as failed.

---

### Requirement 5: AWS ECR Authentication and Push

**User Story:** As a maintainer, I want the pipeline to authenticate to AWS ECR using stored credentials and push all built-and-tested images, so that the registry always holds the latest release artifacts.

#### Acceptance Criteria

1. WHEN all five Image_Tester steps have passed successfully, THE ECR_Publisher SHALL authenticate to AWS ECR using the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` values injected from GitHub Secrets, and the `AWS_REGION` value injected from GitHub Secrets.
2. WHEN ECR authentication succeeds, THE ECR_Publisher SHALL push the Docker image for each Service to its corresponding ECR repository.
3. IF ECR authentication fails, THEN THE CI_Pipeline SHALL mark the workflow run as failed and SHALL not attempt to push any image.
4. IF pushing an image to ECR fails for any Service, THEN THE CI_Pipeline SHALL mark that Service's push step as failed, SHALL halt any remaining push attempts for that Service, and SHALL not push images for other Services that have not yet been pushed.

---

### Requirement 6: Least-Privilege IAM User

**User Story:** As a security engineer, I want the AWS credentials used by the pipeline to belong to a dedicated IAM user with only the permissions required for ECR operations, so that a compromised credential cannot be used to affect any other AWS resource.

#### Acceptance Criteria

1. THE IAM_Provisioner SHALL create a dedicated IAM user named `food-dash-ci-ecr-user` in the AWS account.
2. THE IAM_Provisioner SHALL attach a single customer-managed IAM policy to `food-dash-ci-ecr-user` that grants only the following ECR actions: `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:PutImage`. No other policies (AWS-managed or inline) SHALL be attached.
3. THE IAM_Provisioner SHALL restrict `ecr:BatchCheckLayerAvailability`, `ecr:GetDownloadUrlForLayer`, `ecr:BatchGetImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, and `ecr:PutImage` to resources matching the ARN pattern `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*`.
4. THE IAM_Provisioner SHALL scope the `ecr:GetAuthorizationToken` action to the resource `*`, as this action does not support resource-level restriction.
5. THE IAM_Provisioner SHALL generate a programmatic access key pair (access key ID and secret access key) for `food-dash-ci-ecr-user` and output both values so the maintainer can store them as GitHub Secrets.
6. THE IAM_Provisioner SHALL not attach any permission boundary, permission set, or resource-based policy that grants `food-dash-ci-ecr-user` permissions beyond those listed in Acceptance Criterion 2.
7. IF an AWS API call is made by `food-dash-ci-ecr-user` for any action not listed in Acceptance Criterion 2, THEN AWS SHALL return an `AccessDenied` error by default, as no explicit allow exists for that action.

---

### Requirement 7: GitHub Secrets Integration

**User Story:** As a maintainer, I want the pipeline to consume AWS credentials exclusively through GitHub Secrets, so that no credentials are hardcoded or logged in the workflow files.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL inject the AWS access key ID from the GitHub Secret named `AWS_ACCESS_KEY_ID` as an environment variable into the AWS authentication step.
2. THE CI_Pipeline SHALL inject the AWS secret access key from the GitHub Secret named `AWS_SECRET_ACCESS_KEY` as an environment variable into the AWS authentication step.
3. THE CI_Pipeline SHALL inject the AWS region from the GitHub Secret named `AWS_REGION` as an environment variable into the AWS authentication step.
4. THE CI_Pipeline SHALL inject the ECR registry URI from the GitHub Secret named `AWS_ECR_REGISTRY` as an environment variable into the image tagging and push steps.
5. IF any of the four required GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ECR_REGISTRY`) is absent or resolves to an empty string, THEN THE CI_Pipeline SHALL exit with a non-zero status, emit an error message that identifies the specific missing secret name, and do so before making any AWS API call.
6. THE CI_Pipeline SHALL not print the raw value, any substring, or any base64-encoded representation of any GitHub Secret in workflow logs.

---

### Requirement 8: Workflow File Placement and Structure

**User Story:** As a developer, I want the pipeline workflow file to live at the standard GitHub Actions path and be clearly structured, so that it is automatically discovered by GitHub and is easy to read and maintain.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL be defined in a file located at `.github/workflows/ci.yml` within the FOOD-DASH repository.
2. THE CI_Pipeline SHALL define a distinct, named job for each Service (five jobs total) containing that Service's build and test steps, so each Service's results are visible as a separate entry in the GitHub Actions UI.
3. THE CI_Pipeline SHALL use the `ubuntu-latest` runner for all jobs.
4. WHEN a per-service job completes (success or failure), THE CI_Pipeline SHALL not gate the start or completion of any other per-service job on that result — each Service's job runs and reports independently.
5. THE CI_Pipeline SHALL define a separate push job per Service that depends only on its corresponding per-service build-and-test job, ensuring push steps are also independently visible in the GitHub Actions UI.
