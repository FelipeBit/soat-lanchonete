# Scripts de Deploy e Gerenciamento - SOAT API

Este diretório contém scripts para facilitar o deploy e gerenciamento da aplicação SOAT API em diferentes ambientes.

## 📁 Estrutura dos Scripts

```
scripts/
├── deploy.sh                    # Script principal de deploy (Kustomize)
├── helm-deploy.sh              # Script de deploy usando Helm
├── quick-deploy.sh             # Deploy rápido com Docker build
├── quick-deploy-and-access.sh  # Deploy rápido + acesso automático
├── backup.sh                   # Script de backup e restore do banco
├── validate.sh                 # Script de validação da configuração
├── access.sh                   # Script de acesso à API
├── cleanup.sh                  # Script de limpeza da aplicação
├── test-mock-payments.sh       # Script para testar pagamentos mockados
└── README.md                   # Esta documentação
```

## 🚀 Scripts Disponíveis

### 1. deploy.sh - Deploy com Kustomize

Script principal para deploy usando Kustomize, recomendado para a maioria dos casos.

**Uso:**
```bash
./scripts/deploy.sh [ambiente] [ação] [opções]
```

**Exemplos:**
```bash
# Deploy completo (build + deploy)
./scripts/deploy.sh dev all

# Apenas deploy
./scripts/deploy.sh staging deploy

# Deploy com logs
./scripts/deploy.sh prod all --show-logs

# Verificar status
./scripts/deploy.sh dev status

# Ver logs
./scripts/deploy.sh staging logs --tail=100

# Rollback
./scripts/deploy.sh dev rollback

# Limpeza
./scripts/deploy.sh dev cleanup
```

### 2. helm-deploy.sh - Deploy com Helm

Script alternativo para deploy usando Helm, útil para casos mais complexos.

**Uso:**
```bash
./scripts/helm-deploy.sh [ambiente] [ação] [opções]
```

**Exemplos:**
```bash
# Instalar release
./scripts/helm-deploy.sh dev install

# Atualizar release
./scripts/helm-deploy.sh staging upgrade

# Testar valores
./scripts/helm-deploy.sh prod test

# Rollback
./scripts/helm-deploy.sh prod rollback --revision=2

# Ver histórico
./scripts/helm-deploy.sh dev history
```

### 3. quick-deploy.sh - Deploy Rápido

Script para deploy rápido da aplicação com PostgreSQL, incluindo build da imagem Docker.

**Uso:**
```bash
./scripts/quick-deploy.sh
```

**Funcionalidades:**
- Build automático da imagem Docker
- Deploy do PostgreSQL
- Deploy da aplicação com configurações de desenvolvimento
- Aguarda serviços ficarem prontos

### 4. quick-deploy-and-access.sh - Deploy + Acesso

Script que combina deploy rápido com acesso automático à API.

**Uso:**
```bash
./scripts/quick-deploy-and-access.sh
```

**Funcionalidades:**
- Todas as funcionalidades do quick-deploy.sh
- Port-forward automático para acesso local
- Testes básicos de conectividade
- Exemplos de uso da API

### 5. backup.sh - Backup e Restore

Script para gerenciar backups e restores do banco de dados PostgreSQL.

**Uso:**
```bash
./scripts/backup.sh [ação] [ambiente] [opções]
```

**Exemplos:**
```bash
# Fazer backup
./scripts/backup.sh backup dev

# Listar backups
./scripts/backup.sh list

# Restore
./scripts/backup.sh restore dev --file=./backups/soat-api-dev-20231201_120000.sql.gz

# Verificar status do banco
./scripts/backup.sh status prod
```

### 6. validate.sh - Validação

Script para validar se a configuração do Kubernetes está correta.

**Uso:**
```bash
./scripts/validate.sh [ambiente]
```

**Exemplos:**
```bash
# Validar ambiente de desenvolvimento
./scripts/validate.sh dev

# Validar ambiente de produção
./scripts/validate.sh prod
```

### 7. access.sh - Acesso à API

Script para facilitar o acesso à API após o deploy.

**Uso:**
```bash
./scripts/access.sh [ambiente] [ação] [opções]
```

**Exemplos:**
```bash
# Verificar status do ambiente
./scripts/access.sh dev status

# Mostrar URLs de acesso
./scripts/access.sh dev urls

# Iniciar port-forward
./scripts/access.sh dev port-forward

# Testar endpoints
./scripts/access.sh dev test

# Mostrar exemplos de requests
./scripts/access.sh dev examples
```

### 8. cleanup.sh - Limpeza

Script para limpar completamente a aplicação do Kubernetes.

**Uso:**
```bash
./scripts/cleanup.sh
```

**Funcionalidades:**
- Remove namespace completo
- Remove deployments antigos
- Opção para limpar imagens Docker
- Confirmação antes de limpar imagens

### 9. test-mock-payments.sh - Teste de Pagamentos

Script para testar o sistema de pagamentos mockado da aplicação.

**Uso:**
```bash
./scripts/test-mock-payments.sh
```

**Funcionalidades:**
- Cria cliente de teste
- Cria produtos de teste (se necessário)
- Faz checkout de pedido
- Gera QR Code automaticamente
- Simula aprovação de pagamento
- Demonstra fluxo completo de pagamento

## 🔧 Pré-requisitos

### Ferramentas Necessárias

- **kubectl** (versão 1.24+)
- **Docker** (versão 20.10+)
- **Helm** (versão 3.8+) - apenas para helm-deploy.sh
- **jq** - para parsing JSON nos scripts de teste
- **kind** (para cluster local) - opcional

### Instalação

```bash
# macOS (usando Homebrew)
brew install kubectl
brew install docker
brew install helm
brew install jq

# Ubuntu/Debian
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# jq
sudo apt-get install jq
```

## 🎯 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento Rápido

```bash
# Opção 1: Deploy rápido com acesso
./scripts/quick-deploy-and-access.sh

# Opção 2: Deploy rápido sem acesso
./scripts/quick-deploy.sh

# Opção 3: Deploy tradicional
./scripts/validate.sh dev
./scripts/deploy.sh dev all
./scripts/access.sh dev port-forward
```

### 2. Testes de Pagamento

```bash
# Após o deploy, testar pagamentos
./scripts/test-mock-payments.sh
```

### 3. Staging

```bash
# 1. Fazer backup do ambiente atual
./scripts/backup.sh backup staging

# 2. Fazer deploy
./scripts/deploy.sh staging deploy

# 3. Validar deploy
./scripts/validate.sh staging

# 4. Testar funcionalidades
curl https://staging-api.soat.com/health
```

### 4. Produção

```bash
# 1. Backup obrigatório
./scripts/backup.sh backup prod

# 2. Deploy com validação
./scripts/deploy.sh prod deploy
./scripts/validate.sh prod

# 3. Verificar métricas
kubectl top pods -n soat-api-prod

# 4. Monitorar logs
./scripts/deploy.sh prod logs --tail=100
```

## 🔄 Rollback

### Rollback Rápido

```bash
# Usando Kustomize
./scripts/deploy.sh prod rollback

# Usando Helm
./scripts/helm-deploy.sh prod rollback --revision=2
```

### Rollback Manual

```bash
# Ver histórico
kubectl rollout history deployment/soat-api -n soat-api-prod

# Rollback para versão específica
kubectl rollout undo deployment/soat-api --to-revision=2 -n soat-api-prod

# Aguardar conclusão
kubectl rollout status deployment/soat-api -n soat-api-prod
```

## 🗄️ Backup e Restore

### Backup Automático

```bash
# Backup diário (configurar no crontab)
0 2 * * * /path/to/soat-api/scripts/backup.sh backup prod --backup-dir=/backups

# Backup manual
./scripts/backup.sh backup prod --backup-dir=/tmp/backups
```

### Restore

```bash
# Listar backups disponíveis
./scripts/backup.sh list

# Restore com confirmação
./scripts/backup.sh restore prod --file=./backups/soat-api-prod-20231201_020000.sql.gz
```

## 🧹 Limpeza

### Limpeza Completa

```bash
# Limpar tudo (incluindo namespace)
./scripts/cleanup.sh

# Limpar apenas deployments antigos
kubectl delete deployment soat-api -n default --ignore-not-found=true
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Pods não iniciam

```bash
# Verificar eventos
kubectl get events -n soat-api-dev --sort-by='.lastTimestamp'

# Verificar logs
kubectl logs -n soat-api-dev deployment/soat-api

# Verificar descrição do pod
kubectl describe pod -n soat-api-dev -l app=soat-api
```

#### 2. HPA não escala

```bash
# Verificar métricas
kubectl top pods -n soat-api-dev

# Verificar HPA
kubectl describe hpa -n soat-api-dev

# Verificar se o metrics server está funcionando
kubectl get apiservice v1beta1.metrics.k8s.io
```

#### 3. Ingress não funciona

```bash
# Verificar ingress
kubectl describe ingress -n soat-api-dev

# Verificar serviços
kubectl get svc -n soat-api-dev

# Testar conectividade
kubectl run test-pod --image=busybox --rm -it --restart=Never -- wget -O- http://soat-api-service:3000/health
```

#### 4. PostgreSQL não conecta

```bash
# Verificar logs do PostgreSQL
kubectl logs -n soat-api-dev deployment/postgres

# Testar conectividade
kubectl exec -it -n soat-api-dev deployment/postgres -- pg_isready -U postgres

# Verificar service
kubectl get svc postgres-service -n soat-api-dev
```

### Logs e Debugging

```bash
# Ver logs em tempo real
./scripts/deploy.sh dev logs --tail=100

# Ver logs de um pod específico
kubectl logs -n soat-api-dev pod/soat-api-abc123

# Ver logs de todos os pods
kubectl logs -n soat-api-dev -l app=soat-api
```

## 🔒 Segurança

### Verificações de Segurança

```bash
# Validar configurações de segurança
./scripts/validate.sh prod

# Verificar se os pods rodam como non-root
kubectl get pods -n soat-api-prod -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext.runAsUser}{"\n"}{end}'

# Verificar network policies
kubectl get networkpolicy -n soat-api-prod
```

### Secrets Management

```bash
# Criar secrets
kubectl create secret generic soat-api-secrets \
  --from-literal=DB_PASSWORD=your-password \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=MERCADO_PAGO_ACCESS_TOKEN=your-token \
  -n soat-api-dev

# Verificar secrets
kubectl get secrets -n soat-api-dev
```

## 📊 Monitoramento

### Métricas

```bash
# Ver uso de recursos
kubectl top pods -n soat-api-prod

# Ver métricas do HPA
kubectl describe hpa -n soat-api-prod

# Ver eventos
kubectl get events -n soat-api-prod --sort-by='.lastTimestamp'
```

### Alertas

```bash
# Verificar se os alertas estão configurados
kubectl get prometheusrule -n monitoring

# Verificar status dos alertas
kubectl get alertmanager -n monitoring
```

## 🧪 Testes

### Teste de Pagamentos Mockados

```bash
# Executar teste completo de pagamentos
./scripts/test-mock-payments.sh

# O script demonstra:
# - Criação de cliente
# - Criação de produtos
# - Checkout de pedido
# - Geração de QR Code
# - Simulação de aprovação
```

## 🎯 Próximos Passos

1. **Automatizar backups** com cron jobs
2. **Implementar health checks** mais robustos
3. **Configurar alertas** para métricas importantes
4. **Implementar blue/green deployments**
5. **Configurar disaster recovery**
6. **Implementar canary deployments**
7. **Adicionar testes de integração** automatizados
8. **Implementar CI/CD pipeline** com os scripts

## 📞 Suporte

Para dúvidas ou problemas com os scripts:

- **Documentação**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/soat-api/issues)
- **Slack**: #soat-api-team
- **Email**: team@soat.com 