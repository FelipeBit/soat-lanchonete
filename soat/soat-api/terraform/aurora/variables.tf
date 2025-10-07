variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Optional AWS shared credentials profile name"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "soat-aurora"
}

variable "environment" {
  description = "Environment tag (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "engine" {
  description = "Aurora engine"
  type        = string
  default     = "aurora-mysql"
  validation {
    condition     = contains(["aurora-mysql", "aurora-postgresql"], var.engine)
    error_message = "engine must be one of: aurora-mysql, aurora-postgresql"
  }
}

variable "engine_version" {
  description = "Aurora engine version. Leave empty to let AWS choose a default compatible version."
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Initial database name"
  type        = string
  default     = "appdb"
}

variable "master_username" {
  description = "Master username for the cluster"
  type        = string
  default     = "dbadmin"
}

variable "vpc_id" {
  description = "VPC ID where the cluster will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the database port"
  type        = list(string)
  default     = []
}

variable "allowed_security_group_ids" {
  description = "Security Group IDs allowed to access the database port"
  type        = list(string)
  default     = []
}

variable "allow_public_ingress" {
  description = "If true, opens DB port to 0.0.0.0/0 (for study/dev only)"
  type        = bool
  default     = false
}

variable "publicly_accessible" {
  description = "If true, makes DB instances publicly accessible (requires public subnets)"
  type        = bool
  default     = false
}

variable "instance_count" {
  description = "Number of serverless v2 instances"
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Serverless v2 min capacity in ACUs (0.5 increments)"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Serverless v2 max capacity in ACUs (0.5 increments)"
  type        = number
  default     = 4
}

variable "backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Daily backup window in UTC, e.g., 07:00-09:00"
  type        = string
  default     = "07:00-09:00"
}

variable "preferred_maintenance_window" {
  description = "Weekly maintenance window in UTC, e.g., sun:10:00-sun:12:00"
  type        = string
  default     = "sun:10:00-sun:12:00"
}

variable "deletion_protection" {
  description = "Enable deletion protection on the cluster"
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Whether modifications should be applied immediately"
  type        = bool
  default     = false
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights on instances"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "Optional KMS key ID for storage encryption (if empty, AWS default is used)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional resource tags"
  type        = map(string)
  default     = {}
}


