#!/bin/bash

# Script para limpar a aplicação SOAT API do Kubernetes
# Uso: ./scripts/cleanup.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log "🧹 Limpando aplicação SOAT API..."

# Verificar se o namespace existe
if kubectl get namespace soat-api-dev > /dev/null 2>&1; then
    log "🗑️  Removendo namespace soat-api-dev..."
    kubectl delete namespace soat-api-dev
    success "Namespace removido"
else
    warning "Namespace soat-api-dev não encontrado"
fi

# Limpar deployments antigos se existirem
if kubectl get deployment -n default soat-api > /dev/null 2>&1; then
    log "🗑️  Removendo deployments antigos..."
    kubectl delete deployment soat-api -n default --ignore-not-found=true
    success "Deployments antigos removidos"
fi

# Limpar imagens Docker antigas (opcional)
read -p "Deseja remover imagens Docker antigas da SOAT API? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🐳 Removendo imagens Docker antigas..."
    docker images | grep soat-api | awk '{print $3}' | xargs -r docker rmi -f
    success "Imagens Docker removidas"
fi

success "🎉 Limpeza concluída!" 