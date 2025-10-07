output "cluster_arn" {
  description = "ARN of the RDS cluster"
  value       = aws_rds_cluster.this.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint for the cluster"
  value       = aws_rds_cluster.this.endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint for the cluster"
  value       = aws_rds_cluster.this.reader_endpoint
}

output "db_port" {
  description = "Database port"
  value       = local.db_port
}

output "security_group_id" {
  description = "Security group ID attached to the cluster"
  value       = aws_security_group.aurora.id
}

output "db_subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.aurora.name
}

output "master_user_secret_arn" {
  description = "Secrets Manager ARN where the master credentials are stored"
  value       = try(aws_rds_cluster.this.master_user_secret[0].secret_arn, null)
}


