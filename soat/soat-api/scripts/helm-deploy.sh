#!/bin/bash

# Script de Deploy com Helm - SOAT API
# Uso: ./scripts/helm-deploy.sh [dev|staging|prod] [install|upgrade|uninstall]

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

# Verificar se Helm está instalado
check_helm() {
    if ! command -v helm &> /dev/null; then
        error "Helm não está instalado. Por favor, instale o Helm primeiro."
    fi
}

# Verificar se kubectl está instalado
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        error "kubectl não está instalado. Por favor, instale o kubectl primeiro."
    fi
}

# Verificar se o cluster está acessível
check_cluster() {
    log "Verificando conectividade com o cluster..."
    if ! kubectl cluster-info &> /dev/null; then
        error "Não foi possível conectar ao cluster Kubernetes"
    fi
    success "Cluster acessível"
}

# Função para instalar/atualizar release
deploy_release() {
    local env=$1
    local action=$2
    local namespace="soat-api-${env}"
    local release_name="soat-api"
    local chart_path="./helm/soat-api"
    local values_file="./helm/soat-api/values-${env}.yaml"
    
    log "Executando $action para ambiente: $env"
    log "Namespace: $namespace"
    log "Release: $release_name"
    
    # Verificar se o namespace existe
    if ! kubectl get namespace $namespace &> /dev/null; then
        log "Criando namespace $namespace..."
        kubectl create namespace $namespace
    fi
    
    # Verificar se o arquivo de valores existe
    if [ ! -f "$values_file" ]; then
        error "Arquivo de valores não encontrado: $values_file"
    fi
    
    case $action in
        install)
            log "Instalando release $release_name..."
            helm install $release_name $chart_path \
                --namespace $namespace \
                --create-namespace \
                --values $values_file \
                --wait \
                --timeout 10m
            ;;
        upgrade)
            log "Atualizando release $release_name..."
            helm upgrade $release_name $chart_path \
                --namespace $namespace \
                --values $values_file \
                --wait \
                --timeout 10m
            ;;
        uninstall)
            log "Desinstalando release $release_name..."
            helm uninstall $release_name --namespace $namespace
            ;;
        *)
            error "Ação inválida: $action"
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        success "$action concluído com sucesso!"
        
        if [ "$action" != "uninstall" ]; then
            # Mostrar status do release
            log "Status do release:"
            helm status $release_name --namespace $namespace
            
            # Mostrar recursos criados
            log "Recursos criados:"
            kubectl get all -n $namespace
        fi
    else
        error "Falha no $action"
    fi
}

# Função para listar releases
list_releases() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "Listando releases no namespace $namespace:"
    helm list --namespace $namespace
}

# Função para mostrar histórico
show_history() {
    local env=$1
    local namespace="soat-api-${env}"
    local release_name="soat-api"
    
    log "Histórico do release $release_name:"
    helm history $release_name --namespace $namespace
}

# Função para rollback
rollback_release() {
    local env=$1
    local revision=$2
    local namespace="soat-api-${env}"
    local release_name="soat-api"
    
    if [ -z "$revision" ]; then
        error "Número da revisão não especificado"
    fi
    
    log "Fazendo rollback para revisão $revision..."
    helm rollback $release_name $revision --namespace $namespace --wait --timeout 10m
    
    if [ $? -eq 0 ]; then
        success "Rollback concluído com sucesso!"
    else
        error "Falha no rollback"
    fi
}

# Função para testar valores
test_values() {
    local env=$1
    local chart_path="./helm/soat-api"
    local values_file="./helm/soat-api/values-${env}.yaml"
    
    log "Testando valores para ambiente $env..."
    
    # Verificar se o arquivo de valores existe
    if [ ! -f "$values_file" ]; then
        error "Arquivo de valores não encontrado: $values_file"
    fi
    
    # Fazer template dry-run
    helm template test-release $chart_path \
        --values $values_file \
        --debug
    
    if [ $? -eq 0 ]; then
        success "Valores testados com sucesso!"
    else
        error "Falha na validação dos valores"
    fi
}

# Função para mostrar logs
show_logs() {
    local env=$1
    local namespace="soat-api-${env}"
    local tail=${2:-50}
    
    log "Mostrando logs do ambiente $env (últimas $tail linhas)..."
    kubectl logs -n $namespace deployment/soat-api --tail=$tail -f
}

# Função para mostrar status
show_status() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "Status do ambiente $env:"
    echo ""
    echo "=== RELEASE ==="
    helm list --namespace $namespace
    echo ""
    echo "=== PODS ==="
    kubectl get pods -n $namespace
    echo ""
    echo "=== SERVICES ==="
    kubectl get services -n $namespace
    echo ""
    echo "=== INGRESS ==="
    kubectl get ingress -n $namespace
    echo ""
    echo "=== HPA ==="
    kubectl get hpa -n $namespace
}

# Função para mostrar ajuda
show_help() {
    echo "Script de Deploy com Helm - SOAT API"
    echo ""
    echo "Uso: $0 [ambiente] [ação] [opções]"
    echo ""
    echo "Ambientes:"
    echo "  dev       - Ambiente de desenvolvimento"
    echo "  staging   - Ambiente de staging"
    echo "  prod      - Ambiente de produção"
    echo ""
    echo "Ações:"
    echo "  install   - Instalar release"
    echo "  upgrade   - Atualizar release"
    echo "  uninstall - Desinstalar release"
    echo "  list      - Listar releases"
    echo "  history   - Mostrar histórico"
    echo "  rollback  - Fazer rollback"
    echo "  test      - Testar valores"
    echo "  status    - Mostrar status"
    echo "  logs      - Mostrar logs"
    echo ""
    echo "Opções:"
    echo "  --revision=N    - Número da revisão para rollback"
    echo "  --tail=N        - Número de linhas de log (padrão: 50)"
    echo "  --help          - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev install"
    echo "  $0 staging upgrade"
    echo "  $0 prod rollback --revision=2"
    echo "  $0 dev status"
    echo "  $0 staging logs --tail=100"
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
    local revision=""
    local tail_lines=50
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --revision=*)
                revision="${1#*=}"
                shift
                ;;
            --tail=*)
                tail_lines="${1#*=}"
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
    check_helm
    check_kubectl
    check_cluster
    
    # Executar ação
    case $action in
        install|upgrade|uninstall)
            deploy_release $environment $action
            ;;
        list)
            list_releases $environment
            ;;
        history)
            show_history $environment
            ;;
        rollback)
            rollback_release $environment $revision
            ;;
        test)
            test_values $environment
            ;;
        status)
            show_status $environment
            ;;
        logs)
            show_logs $environment $tail_lines
            ;;
        *)
            error "Ação inválida: $action"
            ;;
    esac
}

# Executar main
main "$@" 