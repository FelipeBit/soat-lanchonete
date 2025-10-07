locals {
  name_prefix = "${var.project_name}-${var.environment}"
  db_port     = var.engine == "aurora-postgresql" ? 5432 : 3306
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = var.private_subnet_ids

  tags = merge({
    Name = "${local.name_prefix}-db-subnets"
  }, var.tags)
}

resource "aws_security_group" "aurora" {
  name        = "${local.name_prefix}-db-sg"
  description = "Aurora access"
  vpc_id      = var.vpc_id

  tags = merge({
    Name = "${local.name_prefix}-db-sg"
  }, var.tags)
}

resource "aws_security_group_rule" "egress_all" {
  type              = "egress"
  security_group_id = aws_security_group.aurora.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "ingress_cidr" {
  for_each          = toset(var.allowed_cidr_blocks)
  type              = "ingress"
  security_group_id = aws_security_group.aurora.id
  from_port         = local.db_port
  to_port           = local.db_port
  protocol          = "tcp"
  cidr_blocks       = [each.value]
}

resource "aws_security_group_rule" "ingress_public" {
  count             = var.allow_public_ingress ? 1 : 0
  type              = "ingress"
  security_group_id = aws_security_group.aurora.id
  from_port         = local.db_port
  to_port           = local.db_port
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "ingress_sg" {
  for_each                 = toset(var.allowed_security_group_ids)
  type                     = "ingress"
  security_group_id        = aws_security_group.aurora.id
  from_port                = local.db_port
  to_port                  = local.db_port
  protocol                 = "tcp"
  source_security_group_id = each.value
}

resource "aws_rds_cluster" "this" {
  cluster_identifier = local.name_prefix
  engine             = var.engine
  engine_version     = var.engine_version != "" ? var.engine_version : null

  database_name = var.database_name

  # Let RDS manage the master user password in Secrets Manager
  manage_master_user_password = true
  master_username             = var.master_username

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window
  deletion_protection          = var.deletion_protection
  copy_tags_to_snapshot        = true
  storage_encrypted            = true
  kms_key_id                   = var.kms_key_id != "" ? var.kms_key_id : null

  # Aurora Serverless v2 scaling config
  serverlessv2_scaling_configuration {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
  }

  tags = merge({
    Name = "${local.name_prefix}-cluster"
  }, var.tags)
}

resource "aws_rds_cluster_instance" "this" {
  count              = var.instance_count
  identifier         = "${local.name_prefix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.this.id
  engine             = var.engine
  instance_class     = "db.serverless"

  publicly_accessible           = var.publicly_accessible
  performance_insights_enabled  = var.performance_insights_enabled
  auto_minor_version_upgrade    = true
  apply_immediately             = var.apply_immediately

  tags = merge({
    Name = "${local.name_prefix}-instance-${count.index + 1}"
  }, var.tags)
}


