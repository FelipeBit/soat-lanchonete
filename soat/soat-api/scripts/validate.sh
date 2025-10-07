#!/bin/bash

# Script de Validação - SOAT API
# Uso: ./scripts/validate.sh [dev|staging|prod]

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
    return 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Contadores
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Função para executar check
run_check() {
    local description="$1"
    local command="$2"
    local expected_result="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log "Verificando: $description"
    
    if eval "$command" > /dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            success "✓ $description"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            error "✗ $description (esperava falha)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            success "✓ $description (falha esperada)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            error "✗ $description"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    fi
}

# Função para verificar se kubectl está instalado
check_kubectl() {
    log "=== Verificando kubectl ==="
    
    run_check "kubectl está instalado" "command -v kubectl" "success"
    
    if command -v kubectl &> /dev/null; then
        run_check "kubectl pode se conectar ao cluster" "kubectl cluster-info" "success"
        run_check "kubectl versão é compatível" "kubectl version --client --short | grep -E 'v1\.(2[4-9]|[3-9][0-9])'" "success"
    fi
}

# Função para verificar namespace
check_namespace() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Namespace ==="
    
    run_check "namespace $namespace existe" "kubectl get namespace $namespace" "success"
    
    if kubectl get namespace $namespace &> /dev/null; then
        run_check "namespace $namespace está ativo" "kubectl get namespace $namespace -o jsonpath='{.status.phase}' | grep -q Active" "success"
    fi
}

# Função para verificar recursos base
check_base_resources() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Recursos Base ==="
    
    # Verificar ConfigMap
    run_check "ConfigMap soat-api-config existe" "kubectl get configmap soat-api-config -n $namespace" "success"
    
    # Verificar Secret
    run_check "Secret soat-api-secrets existe" "kubectl get secret soat-api-secrets -n $namespace" "success"
    
    # Verificar Deployment
    run_check "Deployment soat-api existe" "kubectl get deployment soat-api -n $namespace" "success"
    
    # Verificar Service
    run_check "Service soat-api existe" "kubectl get service soat-api -n $namespace" "success"
    
    # Verificar HPA
    run_check "HPA soat-api existe" "kubectl get hpa soat-api -n $namespace" "success"
    
    # Verificar Ingress
    run_check "Ingress soat-api existe" "kubectl get ingress soat-api -n $namespace" "success"
    
    # Verificar PDB
    run_check "PDB soat-api existe" "kubectl get pdb soat-api -n $namespace" "success"
    
    # Verificar Network Policy
    run_check "Network Policy soat-api existe" "kubectl get networkpolicy soat-api -n $namespace" "success"
}

# Função para verificar deployment
check_deployment() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Deployment ==="
    
    if kubectl get deployment soat-api -n $namespace &> /dev/null; then
        # Verificar se o deployment está pronto
        run_check "Deployment está pronto" "kubectl get deployment soat-api -n $namespace -o jsonpath='{.status.readyReplicas}' | grep -q '[1-9]'" "success"
        
        # Verificar número de réplicas
        local replicas=$(kubectl get deployment soat-api -n $namespace -o jsonpath='{.spec.replicas}')
        local ready_replicas=$(kubectl get deployment soat-api -n $namespace -o jsonpath='{.status.readyReplicas}')
        
        if [ "$replicas" = "$ready_replicas" ]; then
            success "✓ Número correto de réplicas ($ready_replicas/$replicas)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            error "✗ Réplicas não estão prontas ($ready_replicas/$replicas)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar estratégia de rollout
        local strategy=$(kubectl get deployment soat-api -n $namespace -o jsonpath='{.spec.strategy.type}')
        if [ "$strategy" = "RollingUpdate" ]; then
            success "✓ Estratégia de rollout correta (RollingUpdate)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Estratégia de rollout não é RollingUpdate ($strategy)"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Função para verificar pods
check_pods() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Pods ==="
    
    # Verificar se há pods rodando
    local running_pods=$(kubectl get pods -n $namespace -l app=soat-api --field-selector=status.phase=Running --no-headers | wc -l)
    
    if [ "$running_pods" -gt 0 ]; then
        success "✓ $running_pods pod(s) rodando"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        error "✗ Nenhum pod rodando"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    # Verificar health checks
    local pods=$(kubectl get pods -n $namespace -l app=soat-api -o name)
    for pod in $pods; do
        local pod_name=$(echo $pod | cut -d'/' -f2)
        
        # Verificar liveness probe
        local liveness=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.containers[0].livenessProbe.httpGet.path}' 2>/dev/null || echo "")
        if [ "$liveness" = "/health" ]; then
            success "✓ Liveness probe configurado para $pod_name"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Liveness probe não configurado para $pod_name"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar readiness probe
        local readiness=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.containers[0].readinessProbe.httpGet.path}' 2>/dev/null || echo "")
        if [ "$readiness" = "/ready" ]; then
            success "✓ Readiness probe configurado para $pod_name"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Readiness probe não configurado para $pod_name"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    done
}

# Função para verificar service
check_service() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Service ==="
    
    if kubectl get service soat-api -n $namespace &> /dev/null; then
        # Verificar tipo de service
        local service_type=$(kubectl get service soat-api -n $namespace -o jsonpath='{.spec.type}')
        if [ "$service_type" = "ClusterIP" ]; then
            success "✓ Tipo de service correto (ClusterIP)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Tipo de service não é ClusterIP ($service_type)"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar portas
        local port=$(kubectl get service soat-api -n $namespace -o jsonpath='{.spec.ports[0].port}')
        local target_port=$(kubectl get service soat-api -n $namespace -o jsonpath='{.spec.ports[0].targetPort}')
        
        if [ "$port" = "3000" ] && [ "$target_port" = "3000" ]; then
            success "✓ Portas configuradas corretamente ($port:$target_port)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            error "✗ Portas incorretas ($port:$target_port)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Função para verificar ingress
check_ingress() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Ingress ==="
    
    if kubectl get ingress soat-api -n $namespace &> /dev/null; then
        # Verificar se o ingress tem regras
        local rules=$(kubectl get ingress soat-api -n $namespace -o jsonpath='{.spec.rules}' 2>/dev/null || echo "")
        if [ -n "$rules" ]; then
            success "✓ Ingress tem regras configuradas"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            error "✗ Ingress não tem regras"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar se o ingress tem TLS configurado (para staging e prod)
        if [ "$env" = "staging" ] || [ "$env" = "prod" ]; then
            local tls=$(kubectl get ingress soat-api -n $namespace -o jsonpath='{.spec.tls}' 2>/dev/null || echo "")
            if [ -n "$tls" ]; then
                success "✓ TLS configurado para $env"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                warning "⚠ TLS não configurado para $env"
                WARNINGS=$((WARNINGS + 1))
            fi
            TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        fi
    fi
}

# Função para verificar HPA
check_hpa() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando HPA ==="
    
    if kubectl get hpa soat-api -n $namespace &> /dev/null; then
        # Verificar se o HPA está ativo
        local status=$(kubectl get hpa soat-api -n $namespace -o jsonpath='{.status.conditions[?(@.type=="AbleToScale")].status}' 2>/dev/null || echo "")
        if [ "$status" = "True" ]; then
            success "✓ HPA está ativo"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ HPA não está ativo"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar métricas
        local metrics=$(kubectl get hpa soat-api -n $namespace -o jsonpath='{.spec.metrics}' 2>/dev/null || echo "")
        if [ -n "$metrics" ]; then
            success "✓ HPA tem métricas configuradas"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ HPA não tem métricas configuradas"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Função para verificar recursos
check_resources() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Recursos ==="
    
    # Verificar se há limites de recursos configurados
    local pods=$(kubectl get pods -n $namespace -l app=soat-api -o name)
    for pod in $pods; do
        local pod_name=$(echo $pod | cut -d'/' -f2)
        
        # Verificar limites de CPU
        local cpu_limit=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.containers[0].resources.limits.cpu}' 2>/dev/null || echo "")
        if [ -n "$cpu_limit" ]; then
            success "✓ Limite de CPU configurado para $pod_name ($cpu_limit)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Limite de CPU não configurado para $pod_name"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar limites de memória
        local memory_limit=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.containers[0].resources.limits.memory}' 2>/dev/null || echo "")
        if [ -n "$memory_limit" ]; then
            success "✓ Limite de memória configurado para $pod_name ($memory_limit)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Limite de memória não configurado para $pod_name"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    done
}

# Função para verificar segurança
check_security() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Segurança ==="
    
    # Verificar se os pods rodam como non-root
    local pods=$(kubectl get pods -n $namespace -l app=soat-api -o name)
    for pod in $pods; do
        local pod_name=$(echo $pod | cut -d'/' -f2)
        
        local run_as_user=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.securityContext.runAsUser}' 2>/dev/null || echo "")
        if [ "$run_as_user" = "1001" ]; then
            success "✓ Pod $pod_name roda como non-root (UID: $run_as_user)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Pod $pod_name não roda como non-root (UID: $run_as_user)"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        
        # Verificar se o filesystem é read-only
        local read_only=$(kubectl get pod $pod_name -n $namespace -o jsonpath='{.spec.containers[0].securityContext.readOnlyRootFilesystem}' 2>/dev/null || echo "")
        if [ "$read_only" = "true" ]; then
            success "✓ Pod $pod_name tem filesystem read-only"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warning "⚠ Pod $pod_name não tem filesystem read-only"
            WARNINGS=$((WARNINGS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    done
}

# Função para verificar conectividade
check_connectivity() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "=== Verificando Conectividade ==="
    
    # Verificar se o service responde
    local service_ip=$(kubectl get service soat-api -n $namespace -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
    if [ -n "$service_ip" ]; then
        # Criar pod temporário para testar conectividade
        kubectl run connectivity-test --image=busybox --rm -i --restart=Never -n $namespace -- wget -O- http://$service_ip:3000/health --timeout=10 > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            success "✓ Service responde corretamente"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            error "✗ Service não responde"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
}

# Função para mostrar resumo
show_summary() {
    log "=== Resumo da Validação ==="
    echo ""
    echo "Total de verificações: $TOTAL_CHECKS"
    echo "✓ Passou: $PASSED_CHECKS"
    echo "✗ Falhou: $FAILED_CHECKS"
    echo "⚠ Avisos: $WARNINGS"
    echo ""
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        success "Validação concluída com sucesso! ($success_rate%)"
        exit 0
    else
        error "Validação falhou! ($success_rate%)"
        exit 1
    fi
}

# Função para mostrar ajuda
show_help() {
    echo "Script de Validação - SOAT API"
    echo ""
    echo "Uso: $0 [ambiente]"
    echo ""
    echo "Ambientes:"
    echo "  dev       - Ambiente de desenvolvimento"
    echo "  staging   - Ambiente de staging"
    echo "  prod      - Ambiente de produção"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 prod"
}

# Main
main() {
    # Verificar argumentos
    if [ $# -ne 1 ]; then
        show_help
        exit 1
    fi
    
    local environment=$1
    
    # Validar ambiente
    case $environment in
        dev|staging|prod)
            ;;
        *)
            error "Ambiente inválido: $environment. Use: dev, staging, prod"
            exit 1
            ;;
    esac
    
    log "Iniciando validação do ambiente: $environment"
    echo ""
    
    # Executar verificações
    check_kubectl
    echo ""
    
    check_namespace $environment
    echo ""
    
    check_base_resources $environment
    echo ""
    
    check_deployment $environment
    echo ""
    
    check_pods $environment
    echo ""
    
    check_service $environment
    echo ""
    
    check_ingress $environment
    echo ""
    
    check_hpa $environment
    echo ""
    
    check_resources $environment
    echo ""
    
    check_security $environment
    echo ""
    
    check_connectivity $environment
    echo ""
    
    show_summary
}

# Executar main
main "$@" 