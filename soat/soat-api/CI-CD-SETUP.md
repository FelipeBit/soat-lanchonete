# 🚀 SOAT API CI/CD Pipeline Setup

This document explains how to set up automated deployments for the SOAT API using GitHub Actions.

## 📋 Overview

The CI/CD pipeline includes:
- **Automated Testing** on every PR
- **Security Scanning** with Trivy
- **Docker Build & Push** to ECR on merge to main
- **Automated Deployment** to AWS EKS
- **Health Checks** after deployment

## 🔧 Setup Instructions

### 1. GitHub Repository Secrets

You need to configure the following secrets in your GitHub repository:

#### Required Secrets:
- `AWS_ACCESS_KEY_ID`: `YOUR_AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`: `YOUR_AWS_SECRET_ACCESS_KEY`

#### Optional Secrets (for enhanced security):
- `ECR_REGISTRY`: `444162776953.dkr.ecr.us-east-1.amazonaws.com`
- `EKS_CLUSTER_NAME`: `soat-dev-cluster`
- `AWS_REGION`: `us-east-1`

### 2. Setting Up Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret** for each secret above

### 3. Workflow Files

The pipeline consists of two workflow files:

#### `.github/workflows/deploy-soat-api.yml`
- **Triggers**: Push to main, PR to main
- **Features**:
  - Runs tests on PRs
  - Builds and pushes Docker image on merge to main
  - Deploys to AWS EKS
  - Verifies deployment health

#### `.github/workflows/pr-checks.yml`
- **Triggers**: PR to main
- **Features**:
  - Runs tests and linting
  - Security scanning with Trivy
  - Build verification

## 🚀 Pipeline Flow

### On Pull Request:
1. **Test & Lint** - Runs npm test and lint
2. **Security Scan** - Scans for vulnerabilities
3. **Build Check** - Ensures code compiles

### On Merge to Main:
1. **Test** - Runs all tests
2. **Build & Push** - Builds Docker image and pushes to ECR
3. **Deploy** - Deploys to AWS EKS using Helm
4. **Verify** - Checks deployment health

## 📊 Pipeline Features

### ✅ Automated Testing
- Node.js 18 setup
- npm dependency caching
- Linting and testing
- TypeScript compilation check

### 🔒 Security Scanning
- Trivy vulnerability scanner
- SARIF report upload to GitHub Security tab
- File system scanning

### 🐳 Docker Build
- Multi-platform builds (AMD64 for EKS)
- ECR authentication
- Image tagging with branch and SHA
- Build caching for faster builds

### ☸️ Kubernetes Deployment
- Helm-based deployment
- Namespace management
- Secret management
- Health check verification
- Rollout status monitoring

## 🎯 Deployment Process

1. **Code Push** → Triggers pipeline
2. **Build** → Creates Docker image
3. **Push** → Uploads to ECR
4. **Deploy** → Updates EKS deployment
5. **Verify** → Checks health endpoints

## 🔍 Monitoring

### GitHub Actions
- View pipeline status in **Actions** tab
- Check logs for each step
- Monitor deployment progress

### Kubernetes
```bash
# Check deployment status
kubectl get pods -n soat-api

# Check service status
kubectl get services -n soat-api

# Check ingress status
kubectl get ingress -n soat-api
```

## 🛠️ Troubleshooting

### Common Issues:

1. **AWS Credentials Error**
   - Verify secrets are set correctly
   - Check AWS permissions

2. **Docker Build Fails**
   - Check Dockerfile syntax
   - Verify dependencies

3. **Deployment Fails**
   - Check EKS cluster connectivity
   - Verify Helm chart configuration

4. **Health Check Fails**
   - Check application logs
   - Verify LoadBalancer configuration

### Debug Commands:
```bash
# Check pipeline logs
gh run list
gh run view <run-id>

# Check Kubernetes resources
kubectl describe pod <pod-name> -n soat-api
kubectl logs <pod-name> -n soat-api
```

## 📈 Benefits

- **🔄 Automated Deployments** - No manual intervention needed
- **🧪 Quality Assurance** - Tests run on every change
- **🔒 Security** - Vulnerability scanning included
- **📊 Visibility** - Clear pipeline status and logs
- **⚡ Speed** - Fast feedback on changes
- **🛡️ Reliability** - Consistent deployment process

## 🎉 Success Criteria

Your CI/CD pipeline is working when:
- ✅ PRs trigger test workflows
- ✅ Merges to main trigger deployments
- ✅ Docker images are pushed to ECR
- ✅ Applications deploy to EKS successfully
- ✅ Health checks pass after deployment

## 📚 Next Steps

1. **Set up secrets** in GitHub repository
2. **Push code** to trigger first pipeline run
3. **Monitor** pipeline execution
4. **Test** with a small change
5. **Verify** deployment in AWS EKS

---

**🎯 Your SOAT API now has a complete CI/CD pipeline!** 🚀
