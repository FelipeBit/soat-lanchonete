# Provider configurations moved to providers.tf

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_vpc" "default" {
  default = true
}

# Create private route table for Fargate subnets
resource "aws_route_table" "private" {
  vpc_id = data.aws_vpc.default.id
  
  tags = {
    Name = "${local.name_prefix}-private-rt"
  }
}

# Create private subnets for Fargate
resource "aws_subnet" "private_a" {
  vpc_id            = data.aws_vpc.default.id
  cidr_block        = "172.31.96.0/20"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "${local.name_prefix}-private-a"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = data.aws_vpc.default.id
  cidr_block        = "172.31.112.0/20"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "${local.name_prefix}-private-b"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# Use existing public subnets for EKS control plane
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  
  # Use only 2 AZs for cost efficiency: us-east-1a and us-east-1b
  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b"]
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_iam_role" "eks_cluster" {
  name               = "${local.name_prefix}-eks-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.eks_assume_role.json
}

data "aws_iam_policy_document" "eks_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_AmazonEKSClusterPolicy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "this" {
  name     = "${local.name_prefix}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids = var.subnet_ids != null && length(var.subnet_ids) > 0 ? var.subnet_ids : data.aws_subnets.public.ids
    endpoint_public_access = true
    endpoint_private_access = false
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_AmazonEKSClusterPolicy
  ]
}

resource "aws_iam_role" "fargate_pod" {
  name               = "${local.name_prefix}-fargate-pod-role"
  assume_role_policy = data.aws_iam_policy_document.fargate_pod_assume.json
}

data "aws_iam_policy_document" "fargate_pod_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks-fargate-pods.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "AmazonEKSFargatePodExecutionRolePolicy" {
  role       = aws_iam_role.fargate_pod.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
}

resource "aws_eks_fargate_profile" "default" {
  cluster_name           = aws_eks_cluster.this.name
  fargate_profile_name   = "${local.name_prefix}-fp-default"
  pod_execution_role_arn = aws_iam_role.fargate_pod.arn

  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  
  # Match application's namespace and AWS LB Controller if scheduled on Fargate

  selector {
    namespace = var.namespace
  }
}

resource "aws_eks_fargate_profile" "kube_system_coredns" {
  cluster_name           = aws_eks_cluster.this.name
  fargate_profile_name   = "${local.name_prefix}-fp-kube-system-coredns"
  pod_execution_role_arn = aws_iam_role.fargate_pod.arn

  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  selector {
    namespace = "kube-system"
    labels = {
      "k8s-app" = "kube-dns"
    }
  }
}

resource "aws_eks_fargate_profile" "ingress_nginx" {
  cluster_name           = aws_eks_cluster.this.name
  fargate_profile_name   = "${local.name_prefix}-fp-ingress-nginx"
  pod_execution_role_arn = aws_iam_role.fargate_pod.arn

  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  selector {
    namespace = "ingress-nginx"
  }
}

# Data sources moved to providers.tf

# Provider configurations moved to providers.tf

resource "kubernetes_namespace" "soat" {
  metadata {
    name = var.namespace
  }
}

output "cluster_name" {
  value = aws_eks_cluster.this.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  value     = aws_eks_cluster.this.certificate_authority[0].data
  sensitive = true
}


