## Aurora Serverless v2 (Terraform)

This module provisions an Amazon Aurora Serverless v2 cluster (MySQL or PostgreSQL) in your AWS account, within an existing VPC and private subnets.

Important: do not hardcode AWS credentials in files. Use environment variables or a shared credentials profile.

### Prerequisites
- Terraform >= 1.5
- AWS credentials available via one of:
  - `aws configure` (shared credentials), then set `aws_profile` variable, or
  - environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally `AWS_SESSION_TOKEN` and `AWS_REGION`
- Existing VPC and private subnets

### Files
- `providers.tf`, `versions.tf` — provider setup
- `variables.tf` — configurable inputs
- `main.tf` — Aurora cluster, serverless v2 instances, subnet group, security group
- `outputs.tf` — endpoints, secret ARN, etc.
- `terraform.tfvars.example` — sample configuration

### Quickstart
1) Copy and edit `terraform.tfvars.example` to `terraform.tfvars` with your values (VPC, subnets, access rules):
```bash
cp terraform.tfvars.example terraform.tfvars
```

2) Authenticate to AWS (choose one):
```bash
# Using shared credentials
aws configure

# Or using environment variables (example)
export AWS_ACCESS_KEY_ID=... 
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
```

3) Initialize and review the plan:
```bash
terraform init
terraform plan
```

4) Apply:
```bash
terraform apply
```

### Notes
- Aurora Serverless v2 is created with `instance_class = db.serverless` and a `serverlessv2_scaling_configuration` on the cluster.
- Master credentials are stored in AWS Secrets Manager via `manage_master_user_password = true`. The ARN is exported as `master_user_secret_arn`.
- Access is controlled via the DB security group: use `allowed_cidr_blocks` and/or `allowed_security_group_ids`.
- For study/dev public access, set `allow_public_ingress = true` and `publicly_accessible = true`. Ensure your subnets are public and routing allows return traffic.
- If `deletion_protection = true`, destroying the cluster requires setting it to `false` first.

### Destroy
```bash
terraform destroy
```


