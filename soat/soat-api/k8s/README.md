# Arquitetura Kubernetes - SOAT API

## Visão Geral

Esta documentação descreve a arquitetura Kubernetes completa para a aplicação SOAT API, incluindo configurações de segurança, escalabilidade e boas práticas.

## Estrutura de Diretórios

```
k8s/
├── base/                    # Configurações base
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── pdb.yaml
│   ├── network-policy.yaml
│   └── kustomization.yaml
├── overlays/               # Configurações por ambiente
│   ├── dev/
│   │   ├── configmap-patch.yaml
│   │   ├── deployment-patch.yaml
│   │   └── kustomization.yaml
│   ├── staging/
│   │   ├── deployment-patch.yaml
│   │   ├── hpa-patch.yaml
│   │   └── kustomization.yaml
│   └── prod/
│       ├── deployment-patch.yaml
│       ├── hpa-patch.yaml
│       ├── ingress-patch.yaml
│       └── kustomization.yaml
├── environments.yaml       # Configurações centralizadas por ambiente
├── postgres-deployment.yaml # Deployment do PostgreSQL para desenvolvimento
├── soat-api-deployment.yaml # Deployment standalone para desenvolvimento
└── README.md
```

## Componentes da Arquitetura

### 1. Namespace
- **Propósito**: Isolamento de recursos por ambiente
- **Ambientes**: `soat-api-dev`, `soat-api-staging`, `soat-api-prod`

### 2. ConfigMap
- **Propósito**: Configurações não sensíveis
- **Dados**: URLs, configurações de banco, logs, NODE_ENV, LOG_LEVEL

### 3. Secret
- **Propósito**: Dados sensíveis criptografados
- **Dados**: Senhas do banco, tokens do Mercado Pago, JWT_SECRET, WEBHOOK_SECRET

### 4. Deployment
- **Replicas**: 3 (base), dev: 1, staging: 2, prod: 5
- **Estratégia**: RollingUpdate (maxSurge: 1, maxUnavailable: 0)
- **Segurança**: Non-root user (UID 1001), read-only filesystem, dropped capabilities

### 5. Service
- **Tipo**: LoadBalancer (base), NodePort (soat-api-deployment.yaml)
- **Portas**: 80/443 (HTTP/HTTPS) - base, 3000 (NodePort 30001) - standalone
- **Anotações**: AWS Load Balancer (base)

### 6. Horizontal Pod Autoscaler (HPA)
- **Métricas**: CPU (70%), Memory (80%), RPS (100)
- **Escala**: 3-10 pods (base), dev: 1-3, staging: 2-5, prod: 5-20

### 7. Ingress
- **Controller**: NGINX
- **SSL**: Cert-manager + Let's Encrypt (staging/prod)
- **CORS**: Configurado
- **Rate Limiting**: 100 req/min (dev), 200 req/min (staging), configurável (prod)

### 8. Pod Disruption Budget (PDB)
- **Min Available**: 2 pods
- **Propósito**: Alta disponibilidade durante manutenção

### 9. Network Policy
- **Ingress**: Apenas do Ingress Controller
- **Egress**: Apenas para PostgreSQL e internet
- **Propósito**: Segurança de rede

### 10. PostgreSQL Deployment (Desenvolvimento)
- **Arquivo**: `postgres-deployment.yaml`
- **Propósito**: Banco de dados local para desenvolvimento
- **Configuração**: ConfigMap + Secret para credenciais

## Configurações por Ambiente

### Development
- **Replicas**: 1
- **Recursos**: 128Mi/100m (requests), 256Mi/200m (limits)
- **Log Level**: debug
- **Node Env**: development
- **HPA**: 1-3 replicas, CPU 70%, Memory 80%

### Staging
- **Replicas**: 2
- **Recursos**: 256Mi/200m (requests), 512Mi/400m (limits)
- **Log Level**: info
- **Node Env**: staging
- **HPA**: 2-5 replicas, CPU 70%, Memory 80%
- **TLS**: Habilitado com Let's Encrypt

### Production
- **Replicas**: 5
- **Recursos**: 512Mi/500m (requests), 1Gi/1000m (limits)
- **Log Level**: warn
- **Node Env**: production
- **HPA**: 5-20 replicas, CPU 60%, Memory 70%
- **Rate Limiting**: Configurável
- **TLS**: Habilitado com Let's Encrypt

## Segurança

### 1. Pod Security
- **Non-root user**: UID 1001 (base), UID 1000 (prod)
- **Read-only filesystem**: Exceto /tmp e /var/log
- **Dropped capabilities**: ALL
- **No privilege escalation**

### 2. Network Security
- **Network Policies**: Controle de tráfego
- **Ingress**: Apenas HTTPS (staging/prod)
- **CORS**: Configurado por ambiente

### 3. Secrets Management
- **Base64 encoded**: Secrets do Kubernetes
- **External Secrets**: Para produção (recomendado)
- **Rotation**: Automática via CI/CD

## Escalabilidade

### 1. Horizontal Scaling
- **HPA**: Baseado em CPU, Memory e RPS
- **Métricas Customizadas**: Requests per second
- **Behavior**: Configurado para evitar thrashing

### 2. Vertical Scaling
- **Resource Limits**: Definidos por ambiente
- **Requests**: Garantia de recursos
- **Limits**: Prevenção de resource exhaustion

### 3. Rolling Updates
- **Strategy**: RollingUpdate
- **Max Surge**: 1
- **Max Unavailable**: 0

## Monitoramento

### 1. Health Checks
- **Liveness Probe**: /health (comentado no standalone)
- **Readiness Probe**: /ready (comentado no standalone)
- **Initial Delay**: 30s (liveness), 5s (readiness)

### 2. Metrics
- **CPU Usage**: Target 70% (base), 60% (prod)
- **Memory Usage**: Target 80% (base), 70% (prod)
- **Request Rate**: Target 100 RPS

## Deploy

### 1. Development
```bash
# Usando Kustomize
kubectl apply -k k8s/overlays/dev/

# Ou usando deployment standalone
kubectl apply -f k8s/soat-api-deployment.yaml
kubectl apply -f k8s/postgres-deployment.yaml
```

### 2. Staging
```bash
kubectl apply -k k8s/overlays/staging/
```

### 3. Production
```bash
kubectl apply -k k8s/overlays/prod/
```

## Arquivos de Configuração

### environments.yaml
Arquivo centralizado com configurações para todos os ambientes, incluindo:
- Namespaces
- Recursos (CPU/Memory)
- Configurações de HPA
- Variáveis de ambiente
- Secrets
- Configurações de Ingress

### postgres-deployment.yaml
Deployment standalone do PostgreSQL para desenvolvimento local, incluindo:
- ConfigMap para configurações
- Secret para senha
- Service ClusterIP
- Health checks com pg_isready

### soat-api-deployment.yaml
Deployment standalone da aplicação para desenvolvimento, incluindo:
- Service NodePort (porta 30001)
- Configurações hardcoded para desenvolvimento
- Health checks comentados (endpoints não implementados)

## CI/CD

### 1. GitHub Actions
- **Test**: Executa testes automatizados
- **Build**: Cria imagem Docker
- **Deploy**: Aplica manifestos Kubernetes

### 2. Environments
- **Development**: Branch `develop`
- **Staging**: Branch `main`
- **Production**: Tag ou release

## Pré-requisitos

### 1. Cluster Kubernetes
- **Version**: 1.24+
- **Nodes**: 3+ nodes
- **Storage**: Persistent volumes

### 2. Add-ons
- **NGINX Ingress Controller**
- **Cert-manager** (para staging/prod)
- **Metrics Server**
- **Prometheus Operator** (opcional)

### 3. Secrets
- **KUBE_CONFIG_DEV**: Base64 encoded kubeconfig
- **KUBE_CONFIG_STAGING**: Base64 encoded kubeconfig
- **KUBE_CONFIG_PROD**: Base64 encoded kubeconfig

## Troubleshooting

### 1. Pods não iniciam
```bash
kubectl describe pod -n soat-api-dev
kubectl logs -n soat-api-dev deployment/soat-api
```

### 2. HPA não escala
```bash
kubectl describe hpa -n soat-api-dev
kubectl top pods -n soat-api-dev
```

### 3. Ingress não funciona
```bash
kubectl describe ingress -n soat-api-dev
kubectl get events -n soat-api-dev
```

### 4. PostgreSQL não conecta
```bash
kubectl logs -n soat-api-dev deployment/postgres
kubectl exec -it -n soat-api-dev deployment/postgres -- pg_isready -U postgres
```

## Próximos Passos

1. **Implementar External Secrets Operator**
2. **Configurar Prometheus + Grafana**
3. **Implementar Istio Service Mesh**
4. **Configurar Backup automático**
5. **Implementar Blue/Green deployments**
6. **Implementar endpoints de health check (/health, /ready)**
7. **Configurar persistent volumes para PostgreSQL em produção**
8. **Implementar monitoring de métricas customizadas** 