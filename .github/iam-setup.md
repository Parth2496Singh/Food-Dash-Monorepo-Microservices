# AWS IAM Setup for GitHub Actions CI Pipeline

This document describes the one-time manual AWS IAM setup required before the CI pipeline can authenticate to ECR and push Docker images. These steps are performed once by a maintainer with sufficient AWS IAM permissions.

---

## Overview

The pipeline uses a dedicated IAM user (`food-dash-ci-ecr-user`) with a single customer-managed policy that grants only the ECR permissions required to authenticate and push images. No other permissions are granted. The access key pair is stored as GitHub repository secrets consumed by the workflow at runtime.

---

## Step 1: Create the IAM User

1. Open the [AWS IAM Console](https://console.aws.amazon.com/iam/) and navigate to **Users → Add users**.
2. Set the username to exactly: `food-dash-ci-ecr-user`
3. Under **AWS access type**, select **Programmatic access only** — do **not** enable AWS Management Console access.
4. Do not attach any policies at this step; proceed to the next step first.

---

## Step 2: Create the Customer-Managed IAM Policy

1. Navigate to **IAM → Policies → Create policy**.
2. Switch to the **JSON** editor and paste the following policy document, replacing `<region>` and `<account-id>` with your actual AWS region and 12-digit account ID:

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

3. Click **Next**, then give the policy a name such as `food-dash-ci-ecr-policy`.
4. Add an optional description, e.g. `Least-privilege ECR push policy for the food-dash CI pipeline`.
5. Click **Create policy**.

> **Why two statements?** `ecr:GetAuthorizationToken` is a global action that does not support resource-level restrictions — it must be scoped to `"Resource": "*"`. The remaining seven repository actions are scoped to the `food-dash/*` namespace, so they are placed in a separate statement with a precise ARN.

---

## Step 3: Attach the Policy to the User

1. Navigate to **IAM → Users → food-dash-ci-ecr-user → Permissions → Add permissions**.
2. Choose **Attach existing policies directly**.
3. Search for and select the `food-dash-ci-ecr-policy` you created in Step 2.
4. Click **Next → Add permissions**.

**Important:** Do **not** attach any AWS-managed policies (e.g. `AmazonEC2ContainerRegistryFullAccess`) or add any inline policies. The user must have exactly one policy attached — the customer-managed policy above — and nothing else.

---

## Step 4: Generate the Access Key Pair

1. Navigate to **IAM → Users → food-dash-ci-ecr-user → Security credentials**.
2. Under **Access keys**, click **Create access key**.
3. Select the **Other** use case (CLI / programmatic access).
4. Click **Create access key**.
5. **Copy both values immediately** — the secret access key is shown only once:
   - **Access key ID** (e.g. `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key** (e.g. `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

---

## Step 5: Store the Secrets in GitHub

Navigate to your GitHub repository → **Settings → Secrets and variables → Actions → New repository secret** and create the following four secrets:

| Secret name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | The access key ID from Step 4 |
| `AWS_SECRET_ACCESS_KEY` | The secret access key from Step 4 |
| `AWS_REGION` | Your AWS region, e.g. `us-east-1` |
| `AWS_ECR_REGISTRY` | Your ECR registry URI, e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com` |

> The ECR registry URI follows the format `<account-id>.dkr.ecr.<region>.amazonaws.com`. Find it in the [ECR console](https://console.aws.amazon.com/ecr/) under **Private registry**.

---

## Step 6: Verify with AWS IAM Policy Simulator

Use the [AWS IAM Policy Simulator](https://policysim.aws.amazon.com/) (or `aws iam simulate-principal-policy` CLI) to confirm the policy is correct before running the pipeline.

### Expected results

**Actions that must return `allowed`:**

| Action | Resource |
|---|---|
| `ecr:GetAuthorizationToken` | `*` |
| `ecr:BatchCheckLayerAvailability` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |
| `ecr:GetDownloadUrlForLayer` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |
| `ecr:BatchGetImage` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |
| `ecr:InitiateLayerUpload` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |
| `ecr:UploadLayerPart` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |
| `ecr:CompleteLayerUpload` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |
| `ecr:PutImage` | `arn:aws:ecr:<region>:<account-id>:repository/food-dash/*` |

**Actions that must return `implicitDeny` (AccessDenied):**

Test a sample of the following to confirm no unintended permissions exist:

- `s3:GetObject`
- `s3:PutObject`
- `iam:CreateUser`
- `ec2:DescribeInstances`
- `ecr:DeleteRepository`
- `ecr:CreateRepository`

All actions not explicitly listed in the allow statements above must return `AccessDenied` by default, as AWS denies everything not explicitly permitted.

### CLI equivalent

```bash
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::<account-id>:user/food-dash-ci-ecr-user \
  --action-names ecr:GetAuthorizationToken ecr:BatchCheckLayerAvailability ecr:PutImage \
  --resource-arns "arn:aws:ecr:<region>:<account-id>:repository/food-dash/frontend"
```

---

## Security Notes

- The `food-dash-ci-ecr-user` credentials grant access **only** to ECR repositories under the `food-dash/*` namespace. A compromised key cannot be used to modify IAM, access S3, or affect any other AWS resource.
- Rotate the access key pair periodically. When rotating: create a new key, update the GitHub Secrets, verify the pipeline runs successfully, then delete the old key.
- If a key is suspected compromised, deactivate it immediately in **IAM → Users → food-dash-ci-ecr-user → Security credentials**, update the GitHub Secrets with a new key pair, and audit CloudTrail for unexpected `ecr:*` calls.

---

## Step 7: Elastic Container Registry (ECR) Setup

Since the Food-Dash application is a polyglot microservices monorepo, it produces 5 completely different Docker images. ECR requires a separate repository for each distinct image.

You must manually create the following 5 repositories in the AWS ECR Console:
1.  `food-dash/frontend`
2.  `food-dash/restaurant-service`
3.  `food-dash/menu-service`
4.  `food-dash/order-service`
5.  `food-dash/delivery-service`

*(Note: These exact names are hardcoded into the GitHub Actions `.github/workflows/ci.yml` file and the IAM policy above).*

---

## Step 8: How the CI/CD Pipeline Works

The automated pipeline is driven by the `.github/workflows/ci.yml` file. It uses a **Release-Based Deployment Strategy**, meaning it only runs when a Semantic Version tag is pushed to GitHub.

### Triggering the Pipeline
To trigger a deployment, run the following commands in your terminal:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 1. Parallel Smoke Testing
Once triggered, GitHub Actions spins up multiple isolated Ubuntu runners to simultaneously test all 5 microservices. For each service, it:
*   **Builds** the Docker image locally (e.g., `food-dash/frontend:ci`).
*   **Boots** the container with mock database credentials.
*   **Waits** 120 seconds to monitor container stability.
*   **Validates** that the container did not crash (checks for Exit Code `0`, `130`, or `143`).

### 2. Automated Tagging & Pushing
If the smoke test passes, the pipeline prepares the image for AWS ECR:
*   **Authentication:** The runner securely logs into your AWS ECR vault using the GitHub Secrets.
*   **Semantic Version Tagging:** The image is tagged with the exact release number (e.g., `1.0.0`).
*   **Latest Tagging:** The image is also tagged as `latest` to ensure rolling deployments always pull the newest code.
*   **Push:** Both tags are pushed to the specific ECR repository.

---

## Step 9: Manual Tagging and Pushing (Alternative)

If you ever need to manually build, tag, and push an image from your local terminal (bypassing GitHub Actions), here is the exact sequence of commands required:

```bash
# 1. Authenticate your local Docker CLI with AWS ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# 2. Build the Docker Image (Example: Frontend)
docker build -t food-dash/frontend:ci ./frontend

# 3. Tag the image with the specific SemVer version
docker tag food-dash/frontend:ci <account-id>.dkr.ecr.<region>.amazonaws.com/food-dash/frontend:1.0.0

# 4. Tag the image as 'latest'
docker tag food-dash/frontend:ci <account-id>.dkr.ecr.<region>.amazonaws.com/food-dash/frontend:latest

# 5. Push the specific version
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/food-dash/frontend:1.0.0

# 6. Push the latest tag
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/food-dash/frontend:latest
```
*(Repeat steps 2-6 for `restaurant-service`, `menu-service`, `order-service`, and `delivery-service`).*
