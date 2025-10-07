resource "aws_ecr_repository" "soat_api" {
  count                = var.create_ecr ? 1 : 0
  name                 = "soat-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

output "ecr_repository_url" {
  value       = var.create_ecr && length(aws_ecr_repository.soat_api) > 0 ? aws_ecr_repository.soat_api[0].repository_url : var.soat_api_image
  description = "ECR repo URL (created or provided)"
}


