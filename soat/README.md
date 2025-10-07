# SOAT API - Complete Deployment Solution

A comprehensive NestJS application with full AWS EKS deployment, CI/CD pipeline, and infrastructure as code.

## 🏗️ Project Structure

```
soat-api/
├── src/                    # NestJS application source code
├── helm/                   # Kubernetes Helm charts
├── k8s/                    # Kubernetes manifests
├── terraform/              # Infrastructure as Code
│   ├── aurora/            # Aurora RDS database
│   └── eks/               # EKS cluster and services
├── .github/workflows/      # CI/CD pipelines
├── scripts/               # Deployment and utility scripts
└── docs/                  # Documentation
```

## 🚀 Features

- **NestJS Application**: Modern Node.js framework with TypeScript
- **AWS EKS**: Kubernetes cluster with Fargate serverless compute
- **Aurora RDS**: Managed MySQL database
- **Docker**: Containerized application with multi-stage builds
- **Helm**: Kubernetes package management
- **Terraform**: Infrastructure as Code
- **CI/CD**: Automated testing, building, and deployment
- **Security**: Vulnerability scanning and best practices

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Docker
- AWS CLI configured
- kubectl
- Helm 3.x
- Terraform

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm test

# Build application
npm run build
```

### Infrastructure Deployment

```bash
# Deploy Aurora RDS
cd terraform/aurora
terraform init
terraform apply

# Deploy EKS cluster
cd ../eks
terraform init
terraform apply
```

### Application Deployment

```bash
# Build and push Docker image
docker build -t your-ecr-repo/soat-api:latest .
docker push your-ecr-repo/soat-api:latest

# Deploy with Helm
cd helm/soat-api
helm upgrade --install soat-api . --namespace soat-api
```

## 🔄 CI/CD Pipeline

The project includes automated CI/CD with GitHub Actions:

- **Pull Requests**: Automated testing, linting, and security scanning
- **Main Branch**: Automated build, push to ECR, and deployment to EKS

### Required GitHub Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECR_REGISTRY` (optional)
- `EKS_CLUSTER_NAME` (optional)
- `AWS_REGION` (optional)

## 📚 Documentation

- [CI/CD Setup Guide](soat-api/CI-CD-SETUP.md)
- [API Documentation](soat-api/README.md)
- [Infrastructure Guide](soat-api/terraform/README.md)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   AWS EKS       │    │   Aurora RDS    │
│   Actions       │───▶│   Fargate       │───▶│   MySQL         │
│   CI/CD         │    │   SOAT API      │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   ECR           │    │   LoadBalancer  │
│   Docker Images │    │   Internet      │
└─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

- `DB_HOST`: Database host
- `DB_PORT`: Database port (3306)
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name

### Kubernetes Configuration

- **Namespace**: `soat-api`
- **Service**: ClusterIP on port 3000
- **Ingress**: NGINX with SSL termination
- **Health Checks**: `/health` endpoint

## 📊 Monitoring

- **Health Endpoint**: `GET /health`
- **Metrics**: Application and infrastructure metrics
- **Logs**: Centralized logging with AWS CloudWatch
- **Alerts**: Automated monitoring and alerting

## 🚀 Deployment Status

- ✅ **Application**: Deployed and running
- ✅ **Database**: Aurora RDS connected
- ✅ **LoadBalancer**: Internet accessible
- ✅ **CI/CD**: Automated pipeline active
- ✅ **Security**: Vulnerability scanning enabled

## 📞 Support

For questions or issues, please check the documentation or create an issue in the repository.

---

**🎯 Complete SOAT API deployment with full AWS EKS integration and CI/CD pipeline!**
