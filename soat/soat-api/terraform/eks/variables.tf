variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Optional AWS shared credentials profile name"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "soat"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "subnet_ids" {
  description = "Optional explicit subnet IDs to use (fallback to default VPC subnets)"
  type        = list(string)
  default     = []
}

variable "namespace" {
  description = "Kubernetes namespace for app"
  type        = string
  default     = "soat-api"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

variable "soat_api_image" {
  description = "Container image for soat-api (repository URL without tag)"
  type        = string
  default     = "444162776953.dkr.ecr.us-east-1.amazonaws.com/soat-api"
}

variable "soat_api_image_tag" {
  description = "Tag for soat-api image"
  type        = string
  default     = "latest"
}

variable "domain_name" {
  description = "Primary domain for ingress host"
  type        = string
  default     = "api.soat.com"
}

variable "create_ecr" {
  description = "Whether to create an ECR repository via Terraform"
  type        = bool
  default     = false
}


