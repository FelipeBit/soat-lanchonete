provider "aws" {
  region = var.aws_region

  # Optionally use a shared credentials profile (or rely on env vars)
  profile = var.aws_profile != "" ? var.aws_profile : null

  default_tags {
    tags = merge({
      Environment = var.environment,
      Project     = var.project_name
    }, var.tags)
  }
}


