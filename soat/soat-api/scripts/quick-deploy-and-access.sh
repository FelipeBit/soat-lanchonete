#!/bin/bash

# Script para deploy rápido e acesso automático
# Uso: ./scripts/quick-deploy-and-access.sh

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

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    error "kubectl não encontrado. Instale o kubectl primeiro."
    exit 1
fi

# Verificar se Docker está disponível
if ! command -v docker &> /dev/null; then
    error "Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

log "🚀 Iniciando deploy da SOAT API com PostgreSQL..."

# 1. Construir imagem Docker
log "📦 Construindo imagem Docker..."
IMAGE_TAG="soat-api:dev-$(date +%Y%m%d-%H%M%S)"
docker build -t $IMAGE_TAG . > /dev/null 2>&1
success "Imagem construída: $IMAGE_TAG"

# 2. Criar namespace se não existir
log "🏗️  Criando namespace..."
kubectl create namespace soat-api-dev --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1
success "Namespace soat-api-dev criado/verificado"

# 3. Deploy PostgreSQL
log "🐘 Deployando PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml > /dev/null 2>&1
success "PostgreSQL deployado"

# 4. Aguardar PostgreSQL estar pronto
log "⏳ Aguardando PostgreSQL inicializar..."
kubectl wait --for=condition=ready pod -l app=postgres -n soat-api-dev --timeout=120s > /dev/null 2>&1
success "PostgreSQL pronto"

# 5. Atualizar imagem no deployment da aplicação
log "🔄 Atualizando deployment da aplicação..."
# Criar deployment temporário com a nova imagem
cat > /tmp/soat-api-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: soat-api
  namespace: soat-api-dev
  labels:
    app: soat-api
    environment: development
spec:
  replicas: 1
  selector:
    matchLabels:
      app: soat-api
  template:
    metadata:
      labels:
        app: soat-api
        environment: development
    spec:
      containers:
      - name: soat-api
        image: $IMAGE_TAG
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "development"
        - name: LOG_LEVEL
          value: "debug"
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PORT
          value: "5432"
        - name: DB_DATABASE
          value: "soat_dev"
        - name: DB_USERNAME
          value: "postgres"
        - name: DB_PASSWORD
          value: "password"
        - name: API_BASE_URL
          value: "http://localhost:3000"
        - name: MERCADO_PAGO_BASE_URL
          value: "https://api.mercadopago.com"
        - name: MERCADO_PAGO_ACCESS_TOKEN
          value: "TEST-TOKEN"
        - name: JWT_SECRET
          value: "dev-secret-key"
        - name: WEBHOOK_SECRET
          value: "dev-webhook-secret"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: soat-api-service
  namespace: soat-api-dev
  labels:
    app: soat-api
spec:
  type: NodePort
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30001
    protocol: TCP
  selector:
    app: soat-api
EOF

# Aplicar deployment
kubectl apply -f /tmp/soat-api-deployment.yaml > /dev/null 2>&1
success "Aplicação deployada"

# 6. Aguardar aplicação estar pronta
log "⏳ Aguardando aplicação inicializar..."
kubectl wait --for=condition=ready pod -l app=soat-api -n soat-api-dev --timeout=180s > /dev/null 2>&1
success "Aplicação pronta"

# 7. Mostrar status
log "📊 Status dos pods:"
kubectl get pods -n soat-api-dev

# 8. Mostrar URLs de acesso
echo ""
log "🌐 URLs de acesso:"
echo "   Swagger UI: http://localhost:30001/api"
echo "   API Base:   http://localhost:30001"
echo ""
log "🔗 Acesso direto via NodePort (sem port-forward):"
echo "   curl http://localhost:30001/api"
echo "   curl http://localhost:30001/products"
echo ""

# 9. Testar conectividade do NodePort
log "🔍 Testando conectividade do NodePort..."
if curl -s --connect-timeout 5 http://localhost:30001/api > /dev/null 2>&1; then
    success "NodePort funcionando corretamente!"
    NODEPORT_WORKING=true
else
    warning "NodePort não está funcionando. Iniciando port-forward..."
    # Parar qualquer port-forward anterior
    pkill -f "kubectl port-forward.*3000:3000" > /dev/null 2>&1 || true
    sleep 2
    
    # Iniciar port-forward em background
    kubectl port-forward -n soat-api-dev svc/soat-api-service 3000:3000 > /dev/null 2>&1 &
    PORT_FORWARD_PID=$!
    
    # Aguardar mais tempo para o port-forward inicializar
    log "⏳ Aguardando port-forward inicializar..."
    sleep 5
    
    # Testar múltiplas vezes
    for i in {1..3}; do
        if curl -s --connect-timeout 3 http://localhost:3000/api > /dev/null 2>&1; then
            success "Port-forward iniciado com sucesso!"
            echo ""
            log "🌐 URLs de acesso (via port-forward):"
            echo "   Swagger UI: http://localhost:3000/api"
            echo "   API Base:   http://localhost:3000"
            echo ""
            log "🔗 Acesso via port-forward:"
            echo "   curl http://localhost:3000/api"
            echo "   curl http://localhost:3000/products"
            echo ""
            log "📋 Para parar o port-forward: kill $PORT_FORWARD_PID"
            NODEPORT_WORKING=false
            break
        else
            if [ $i -eq 3 ]; then
                error "Falha ao iniciar port-forward após 3 tentativas"
                NODEPORT_WORKING=false
            else
                log "Tentativa $i falhou, aguardando..."
                sleep 2
            fi
        fi
    done
fi

log "📋 Comandos úteis:"
echo "   kubectl logs -n soat-api-dev -l app=soat-api"
echo "   kubectl logs -n soat-api-dev -l app=postgres"
echo "   kubectl get pods -n soat-api-dev"
echo ""

if [ "$NODEPORT_WORKING" = true ]; then
    success "🎉 Deploy concluído com sucesso!"
    success "Sua SOAT API está rodando no Kubernetes com PostgreSQL!"
    success "Acesse diretamente em: http://localhost:30001/api"
else
    success "🎉 Deploy concluído com sucesso!"
    success "Sua SOAT API está rodando no Kubernetes com PostgreSQL!"
    success "Acesse via port-forward em: http://localhost:3000/api"
fi 