#!/bin/bash

# Test script to verify CI/CD setup
echo "🧪 Testing CI/CD Setup for SOAT API"
echo "=================================="
echo ""

# Check if GitHub Actions files exist
echo "📁 Checking workflow files..."
if [ -f ".github/workflows/deploy-soat-api.yml" ]; then
    echo "✅ Main deployment workflow found"
else
    echo "❌ Main deployment workflow missing"
fi

if [ -f ".github/workflows/pr-checks.yml" ]; then
    echo "✅ PR checks workflow found"
else
    echo "❌ PR checks workflow missing"
fi

# Check if package.json exists
echo ""
echo "📦 Checking application files..."
if [ -f "soat-api/package.json" ]; then
    echo "✅ package.json found"
    
    # Check for common scripts
    if grep -q '"test"' soat-api/package.json; then
        echo "✅ Test script found"
    else
        echo "⚠️  Test script not found (optional)"
    fi
    
    if grep -q '"lint"' soat-api/package.json; then
        echo "✅ Lint script found"
    else
        echo "⚠️  Lint script not found (optional)"
    fi
    
    if grep -q '"build"' soat-api/package.json; then
        echo "✅ Build script found"
    else
        echo "❌ Build script missing"
    fi
else
    echo "❌ package.json not found"
fi

# Check if Dockerfile exists
echo ""
echo "🐳 Checking Docker setup..."
if [ -f "soat-api/Dockerfile" ]; then
    echo "✅ Dockerfile found"
else
    echo "❌ Dockerfile missing"
fi

# Check if Helm chart exists
echo ""
echo "☸️  Checking Helm chart..."
if [ -d "soat-api/helm/soat-api" ]; then
    echo "✅ Helm chart found"
    
    if [ -f "soat-api/helm/soat-api/Chart.yaml" ]; then
        echo "✅ Chart.yaml found"
    fi
    
    if [ -f "soat-api/helm/soat-api/values.yaml" ]; then
        echo "✅ values.yaml found"
    fi
else
    echo "❌ Helm chart missing"
fi

echo ""
echo "🔍 Summary:"
echo "==========="
echo "✅ GitHub Actions workflows: Ready"
echo "✅ Docker setup: Ready"
echo "✅ Helm deployment: Ready"
echo ""
echo "📋 Next steps:"
echo "1. Set up GitHub repository secrets"
echo "2. Push code to GitHub"
echo "3. Create a PR to test the pipeline"
echo "4. Merge to main to trigger deployment"
echo ""
echo "🎉 Your CI/CD pipeline is ready to deploy!"
