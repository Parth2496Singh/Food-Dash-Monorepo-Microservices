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
