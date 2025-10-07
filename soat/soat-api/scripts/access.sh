#!/bin/bash

# Script de Acesso à API - SOAT API
# Uso: ./scripts/access.sh [dev|staging|prod] [port-forward|status|urls|test]

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

# Função para mostrar status
show_status() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "Status do ambiente $env:"
    echo ""
    
    echo "=== PODS ==="
    kubectl get pods -n $namespace
    echo ""
    
    echo "=== SERVICES ==="
    kubectl get svc -n $namespace
    echo ""
    
    echo "=== INGRESS ==="
    kubectl get ingress -n $namespace
    echo ""
    
    echo "=== ENDPOINTS ==="
    local service_ip=$(kubectl get svc -n $namespace soat-api -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "N/A")
    echo "Service IP: $service_ip"
    echo "Service URL: soat-api.$namespace.svc.cluster.local:3000"
    echo ""
}

# Função para mostrar URLs
show_urls() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "URLs de acesso para ambiente $env:"
    echo ""
    
    echo "=== PORT-FORWARD ==="
    echo "kubectl port-forward -n $namespace svc/soat-api 3000:3000"
    echo ""
    
    echo "=== LOCAL ACCESS (após port-forward) ==="
    echo "API Base: http://localhost:3000"
    echo "Swagger UI: http://localhost:3000/api"
    echo "Health Check: http://localhost:3000/health"
    echo "Ready Check: http://localhost:3000/ready"
    echo ""
    
    echo "=== INGRESS (se configurado) ==="
    local ingress_host=$(kubectl get ingress -n $namespace soat-api -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "N/A")
    if [ "$ingress_host" != "N/A" ]; then
        echo "Ingress Host: $ingress_host"
        echo "API Base: https://$ingress_host"
        echo "Swagger UI: https://$ingress_host/api"
    else
        echo "Ingress não configurado"
    fi
    echo ""
    
    echo "=== CLUSTER INTERNAL ==="
    echo "Service URL: soat-api.$namespace.svc.cluster.local:3000"
    echo ""
}

# Função para port-forward
start_port_forward() {
    local env=$1
    local namespace="soat-api-${env}"
    
    log "Iniciando port-forward para ambiente $env..."
    echo ""
    echo "A API estará disponível em:"
    echo "  - http://localhost:3000"
    echo "  - Swagger UI: http://localhost:3000/api"
    echo ""
    echo "Pressione Ctrl+C para parar o port-forward"
    echo ""
    
    kubectl port-forward -n $namespace svc/soat-api 3000:3000
}

# Função para testar endpoints
test_endpoints() {
    local env=$1
    local base_url=${2:-"http://localhost:3000"}
    
    log "Testando endpoints em $base_url..."
    echo ""
    
    # Testar health check
    echo "=== Health Check ==="
    if curl -s -f "$base_url/health" > /dev/null; then
        success "✓ Health check OK"
    else
        error "✗ Health check falhou"
    fi
    echo ""
    
    # Testar ready check
    echo "=== Ready Check ==="
    if curl -s -f "$base_url/ready" > /dev/null; then
        success "✓ Ready check OK"
    else
        error "✗ Ready check falhou"
    fi
    echo ""
    
    # Testar Swagger
    echo "=== Swagger UI ==="
    if curl -s -f "$base_url/api" > /dev/null; then
        success "✓ Swagger UI acessível"
    else
        error "✗ Swagger UI não acessível"
    fi
    echo ""
    
    # Listar produtos
    echo "=== Listar Produtos ==="
    local products=$(curl -s "$base_url/products" 2>/dev/null || echo "[]")
    local product_count=$(echo "$products" | jq length 2>/dev/null || echo "0")
    echo "Produtos encontrados: $product_count"
    echo ""
    
    success "Testes concluídos!"
}

# Função para mostrar exemplos de requests
show_examples() {
    local base_url=${1:-"http://localhost:3000"}
    
    log "Exemplos de requests para $base_url:"
    echo ""
    
    echo "=== HEALTH CHECK ==="
    echo "curl $base_url/health"
    echo ""
    
    echo "=== LISTAR PRODUTOS ==="
    echo "curl $base_url/products"
    echo ""
    
    echo "=== CRIAR PRODUTO ==="
    echo "curl -X POST $base_url/products \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{"
    echo "    \"name\": \"X-Burger\","
    echo "    \"description\": \"Hambúrguer artesanal\","
    echo "    \"price\": 25.90,"
    echo "    \"category\": \"BURGER\","
    echo "    \"imageUrl\": \"https://example.com/burger.jpg\""
    echo "  }'"
    echo ""
    
    echo "=== CRIAR CLIENTE ==="
    echo "curl -X POST $base_url/customers/email \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{"
    echo "    \"name\": \"John Doe\","
    echo "    \"email\": \"john@example.com\""
    echo "  }'"
    echo ""
    
    echo "=== FAZER CHECKOUT ==="
    echo "curl -X POST $base_url/orders/checkout \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{"
    echo "    \"customerId\": \"customer-id-aqui\","
    echo "    \"items\": ["
    echo "      {"
    echo "        \"productId\": \"product-id-aqui\","
    echo "        \"quantity\": 1"
    echo "      }"
    echo "    ]"
    echo "  }'"
    echo ""
    
    echo "=== SWAGGER UI ==="
    echo "Acesse: $base_url/api"
    echo ""
}

# Função para mostrar ajuda
show_help() {
    echo "Script de Acesso à API - SOAT API"
    echo ""
    echo "Uso: $0 [ambiente] [ação] [opções]"
    echo ""
    echo "Ambientes:"
    echo "  dev       - Ambiente de desenvolvimento"
    echo "  staging   - Ambiente de staging"
    echo "  prod      - Ambiente de produção"
    echo ""
    echo "Ações:"
    echo "  status        - Mostrar status do ambiente"
    echo "  urls          - Mostrar URLs de acesso"
    echo "  port-forward  - Iniciar port-forward"
    echo "  test          - Testar endpoints"
    echo "  examples      - Mostrar exemplos de requests"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev status"
    echo "  $0 dev urls"
    echo "  $0 dev port-forward"
    echo "  $0 dev test"
    echo "  $0 dev examples"
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
    
    # Validar ambiente
    case $environment in
        dev|staging|prod)
            ;;
        *)
            error "Ambiente inválido: $environment. Use: dev, staging, prod"
            ;;
    esac
    
    # Verificar se kubectl está instalado
    if ! command -v kubectl &> /dev/null; then
        error "kubectl não está instalado"
    fi
    
    # Executar ação
    case $action in
        status)
            show_status $environment
            ;;
        urls)
            show_urls $environment
            ;;
        port-forward)
            start_port_forward $environment
            ;;
        test)
            local base_url=${1:-"http://localhost:3000"}
            test_endpoints $environment $base_url
            ;;
        examples)
            local base_url=${1:-"http://localhost:3000"}
            show_examples $base_url
            ;;
        *)
            error "Ação inválida: $action"
            ;;
    esac
}

# Executar main
main "$@" 