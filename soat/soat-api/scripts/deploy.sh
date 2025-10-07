#!/bin/bash

# Script de Deploy Local - SOAT API
# Uso: ./scripts/deploy.sh [dev|staging|prod] [build|deploy|all]

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

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se kubectl está instalado
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        error "kubectl não está instalado. Por favor, instale o kubectl primeiro."
    fi
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Por favor, instale o Docker primeiro."
    fi
}

# Verificar se kind está instalado (para cluster local)
check_kind() {
    if ! command -v kind &> /dev/null; then
        warning "kind não está instalado. Para cluster local, instale o kind: https://kind.sigs.k8s.io/"
    fi
}

# Build da imagem Docker
build_image() {
    local environment=$1
    local tag="soat-api:${environment}-$(date +%Y%m%d-%H%M%S)"
    
    log "Construindo imagem Docker..."
    docker build -t $tag .
    
    if [ $? -eq 0 ]; then
        success "Imagem construída com sucesso: $tag"
        echo $tag > .image-tag
    else
        error "Falha ao construir imagem Docker"
    fi
}

# Deploy para Kubernetes
deploy_k8s() {
    local environment=$1
    local image_tag=$(cat .image-tag 2>/dev/null || echo "soat-api:latest")
    
    log "Fazendo deploy para ambiente: $environment"
    
    # Verificar se o namespace existe
    if ! kubectl get namespace soat-api-${environment} &> /dev/null; then
        log "Criando namespace soat-api-${environment}..."
        kubectl create namespace soat-api-${environment}
    fi
    
    # Aplicar configurações específicas do ambiente (que inclui o base)
    log "Aplicando configurações do ambiente $environment..."
    kubectl apply -k k8s/overlays/${environment}/
    
    # Aguardar rollout
    log "Aguardando rollout do deployment..."
    kubectl rollout status deployment/soat-api -n soat-api-${environment} --timeout=300s
    
    if [ $? -eq 0 ]; then
        success "Deploy concluído com sucesso!"
        
        # Mostrar informações do deploy
        log "Informações do deploy:"
        kubectl get pods -n soat-api-${environment}
        kubectl get services -n soat-api-${environment}
        kubectl get ingress -n soat-api-${environment}
        
        # Mostrar logs se solicitado
        if [ "$SHOW_LOGS" = "true" ]; then
            log "Mostrando logs do deployment..."
            kubectl logs -n soat-api-${environment} deployment/soat-api --tail=50 -f
        fi
    else
        error "Falha no deploy. Verifique os logs: kubectl logs -n soat-api-${environment} deployment/soat-api"
    fi
}

# Rollback
rollback() {
    local environment=$1
    
    log "Fazendo rollback do deployment..."
    kubectl rollout undo deployment/soat-api -n soat-api-${environment}
    kubectl rollout status deployment/soat-api -n soat-api-${environment} --timeout=300s
    
    if [ $? -eq 0 ]; then
        success "Rollback concluído com sucesso!"
    else
        error "Falha no rollback"
    fi
}

# Limpeza
cleanup() {
    local environment=$1
    
    log "Limpando recursos do ambiente $environment..."
    kubectl delete -k k8s/overlays/${environment}/ --ignore-not-found=true
    kubectl delete namespace soat-api-${environment} --ignore-not-found=true
    
    success "Limpeza concluída!"
}

# Mostrar status
status() {
    local environment=$1
    
    log "Status do ambiente $environment:"
    echo "=== PODS ==="
    kubectl get pods -n soat-api-${environment}
    echo ""
    echo "=== SERVICES ==="
    kubectl get services -n soat-api-${environment}
    echo ""
    echo "=== INGRESS ==="
    kubectl get ingress -n soat-api-${environment}
    echo ""
    echo "=== HPA ==="
    kubectl get hpa -n soat-api-${environment}
}

# Mostrar logs
logs() {
    local environment=$1
    local tail=${2:-50}
    
    log "Mostrando logs do ambiente $environment (últimas $tail linhas)..."
    kubectl logs -n soat-api-${environment} deployment/soat-api --tail=$tail -f
}

# Mostrar ajuda
show_help() {
    echo "Script de Deploy Local - SOAT API"
    echo ""
    echo "Uso: $0 [ambiente] [ação] [opções]"
    echo ""
    echo "Ambientes:"
    echo "  dev       - Ambiente de desenvolvimento"
    echo "  staging   - Ambiente de staging"
    echo "  prod      - Ambiente de produção"
    echo ""
    echo "Ações:"
    echo "  build     - Construir imagem Docker"
    echo "  deploy    - Fazer deploy para Kubernetes"
    echo "  all       - Build + Deploy"
    echo "  rollback  - Fazer rollback do deployment"
    echo "  cleanup   - Limpar recursos do ambiente"
    echo "  status    - Mostrar status do ambiente"
    echo "  logs      - Mostrar logs do deployment"
    echo ""
    echo "Opções:"
    echo "  --show-logs    - Mostrar logs após deploy"
    echo "  --tail=N       - Número de linhas de log (padrão: 50)"
    echo "  --help         - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev all"
    echo "  $0 staging deploy --show-logs"
    echo "  $0 prod status"
    echo "  $0 dev logs --tail=100"
}

# Main
main() {
    # Verificar argumentos
    if [ $# -lt 2 ]; then
        show_help
        exit 1
    fi
    
    local environment=$1
    local action=$2
    shift 2
    
    # Processar opções
    while [[ $# -gt 0 ]]; do
        case $1 in
            --show-logs)
                SHOW_LOGS=true
                shift
                ;;
            --tail=*)
                TAIL_LINES="${1#*=}"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Opção desconhecida: $1"
                ;;
        esac
    done
    
    # Validar ambiente
    case $environment in
        dev|staging|prod)
            ;;
        *)
            error "Ambiente inválido: $environment. Use: dev, staging, prod"
            ;;
    esac
    
    # Verificar pré-requisitos
    check_kubectl
    check_docker
    
    # Executar ação
    case $action in
        build)
            build_image $environment
            ;;
        deploy)
            deploy_k8s $environment
            ;;
        all)
            build_image $environment
            deploy_k8s $environment
            ;;
        rollback)
            rollback $environment
            ;;
        cleanup)
            cleanup $environment
            ;;
        status)
            status $environment
            ;;
        logs)
            logs $environment $TAIL_LINES
            ;;
        *)
            error "Ação inválida: $action"
            ;;
    esac
}

# Executar main
main "$@" 