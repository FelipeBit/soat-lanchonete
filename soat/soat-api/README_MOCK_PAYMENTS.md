# Sistema de Pagamentos Mockado - SOAT API

## 🚀 Visão Geral

Este sistema implementa uma versão mockada completa do fluxo de pagamentos, simulando o comportamento do Mercado Pago sem necessidade de integração real. Ideal para desenvolvimento, testes e demonstrações.

## 📋 Funcionalidades

### ✅ Implementadas
- ✅ Geração de QR Code mockado
- ✅ Simulação de aprovação/rejeição/cancelamento de pagamentos
- ✅ Webhooks mockados
- ✅ Consulta de status de pagamentos
- ✅ Listagem de pagamentos pendentes
- ✅ Integração completa com o sistema de pedidos
- ✅ Validações de negócio
- ✅ Logs detalhados
- ✅ Testes unitários
- ✅ Script de teste automatizado

### 🔄 Fluxo Completo
1. **Checkout** → Pedido criado com status `PENDING`
2. **QR Code** → Geração manual de QR Code mockado
3. **Simulação** → Aprovação/rejeição/cancelamento
4. **Webhook** → Processamento automático
5. **Atualização** → Status do pedido atualizado
6. **Cozinha** → Pedido disponível para preparação

## 🛠️ Como Usar

### 1. Iniciar a Aplicação

```bash
# Instalar dependências
npm install

# Iniciar o servidor
npm run start:dev
```

### 2. Teste Rápido

```bash
# Executar o script de teste completo
./scripts/test-mock-payments.sh
```

### 3. Teste Manual

```bash
# 1. Criar cliente
curl -X POST http://localhost:3000/customers/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Cliente Teste"}'

# 2. Fazer checkout (NÃO gera QR Code automaticamente)
curl -X POST http://localhost:3000/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-id",
    "items": [{"productId": "1", "quantity": 2}]
  }'

# 3. Gerar QR Code manualmente (usando orderId do checkout)
curl -X POST http://localhost:3000/mock-payments/qr-code \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-id-from-checkout",
    "description": "Pedido de teste"
  }'

# 4. Simular aprovação (usando paymentId do QR Code)
curl -X POST http://localhost:3000/mock-payments/simulate-approval/payment-id

# 5. Verificar status
curl -X GET http://localhost:3000/orders/order-id/payment-status
```

## 📚 Endpoints Disponíveis

### Mock Payments (`/mock-payments`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/qr-code` | Gerar QR Code mockado |
| `POST` | `/webhook` | Receber webhook mockado |
| `POST` | `/simulate-approval/{paymentId}` | Simular aprovação |
| `POST` | `/simulate-rejection/{paymentId}` | Simular rejeição |
| `POST` | `/simulate-cancellation/{paymentId}` | Simular cancelamento |
| `GET` | `/status/{paymentId}` | Consultar status |
| `GET` | `/pending` | Listar pendentes |
| `POST` | `/clear-old-payments` | Limpar antigos |

### Orders (`/orders`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/checkout` | Criar pedido (NÃO gera QR Code) |
| `GET` | `/{id}/payment-status` | Status do pagamento |
| `POST` | `/{id}/status` | Atualizar status |
| `GET` | `/active` | Pedidos ativos |

### Payment (`/payments`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/qr-code` | Gerar QR Code real (Mercado Pago) |

## 🎯 Cenários de Teste

### Cenário 1: Pagamento Aprovado
```bash
# 1. Fazer checkout
CHECKOUT_RESPONSE=$(curl -s -X POST http://localhost:3000/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "items": [{"productId": "1", "quantity": 2}]
  }')

ORDER_ID=$(echo $CHECKOUT_RESPONSE | jq -r '.order.id')

# 2. Gerar QR Code
QRCODE_RESPONSE=$(curl -s -X POST http://localhost:3000/mock-payments/qr-code \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"description\": \"Pedido de teste\"
  }")

# 3. Extrair Payment ID
PAYMENT_ID=$(echo $QRCODE_RESPONSE | jq -r '.qrData' | sed 's/mock_qr_data_.*_//')

# 4. Aprovar pagamento
curl -X POST http://localhost:3000/mock-payments/simulate-approval/$PAYMENT_ID

# 5. Verificar resultado
curl -X GET http://localhost:3000/orders/$ORDER_ID/payment-status
```

### Cenário 2: Pagamento Rejeitado
```bash
# Mesmo processo, mas com rejeição
curl -X POST http://localhost:3000/mock-payments/simulate-rejection/$PAYMENT_ID
```

### Cenário 3: Múltiplos Pagamentos
```bash
# Script para criar múltiplos pedidos com cenários diferentes
for i in {1..5}; do
  # Criar pedido e simular aprovação/rejeição aleatoriamente
  # (ver script completo no arquivo test-mock-payments.sh)
done
```

## 🔧 Configuração

### Variáveis de Ambiente
```env
# URL base da API (opcional)
API_BASE_URL=http://localhost:3000

# Modo de debug (opcional)
DEBUG_MOCK_PAYMENTS=true
```

### Logs
O sistema gera logs com prefixo `[MOCK]`:
```
[MOCK] QR Code criado para pedido order-123 - Payment ID: payment-456
[MOCK] Pagamento payment-456 aprovado para pedido order-123
[MOCK] Payment payment-456 processed for order order-123 with status APPROVED
```

## 🧪 Testes

### Executar Testes Unitários
```bash
# Testes do serviço mockado
npm test -- mock-payment.service.spec.ts

# Testes do controlador mockado
npm test -- mock-payment.controller.spec.ts

# Todos os testes
npm test
```

### Executar Testes E2E
```bash
# Teste completo do fluxo
./scripts/test-mock-payments.sh
```

## 📊 Monitoramento

### Status dos Pagamentos
- **PENDING** - Aguardando aprovação
- **APPROVED** - Pagamento aprovado
- **REJECTED** - Pagamento rejeitado
- **CANCELLED** - Pagamento cancelado

### Comandos Úteis
```bash
# Listar pagamentos pendentes
curl -X GET http://localhost:3000/mock-payments/pending

# Verificar status de um pagamento
curl -X GET http://localhost:3000/mock-payments/status/{paymentId}

# Limpar pagamentos antigos
curl -X POST http://localhost:3000/mock-payments/clear-old-payments
```

## 🔄 Migração para Produção

Para migrar do sistema mockado para o Mercado Pago real:

1. **Substituir Serviços**
   ```typescript
   // Trocar MockPaymentService por MercadoPagoService
   // Trocar MockWebhookService por WebhookService
   ```

2. **Atualizar Endpoints**
   ```typescript
   // Usar endpoints reais do Mercado Pago
   // Configurar webhooks reais
   ```

3. **Validar Assinaturas**
   ```typescript
   // Implementar validação de assinatura real
   // Configurar chaves de API
   ```

4. **Testes de Integração**
   ```bash
   # Executar testes com ambiente real
   # Validar fluxo completo
   ```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Payment ID não encontrado**
   ```bash
   # Verificar se o QR Code foi gerado
   curl -X GET http://localhost:3000/mock-payments/pending
   ```

2. **Status não atualizado**
   ```bash
   # Verificar logs do sistema
   # Consultar status do pedido
   curl -X GET http://localhost:3000/orders/{orderId}/payment-status
   ```

3. **Pedido não aparece na cozinha**
   ```bash
   # Verificar se o pagamento foi aprovado
   # Consultar pedidos ativos
   curl -X GET http://localhost:3000/orders/active
   ```

4. **QR Code não gerado no checkout**
   ```bash
   # O checkout NÃO gera QR Code automaticamente
   # É necessário chamar /mock-payments/qr-code separadamente
   ```

### Logs de Debug
```bash
# Ativar logs detalhados
DEBUG_MOCK_PAYMENTS=true npm run start:dev
```

## 📈 Vantagens

### ✅ Desenvolvimento
- **Isolamento**: Não depende de serviços externos
- **Controle**: Permite simular qualquer cenário
- **Velocidade**: Resposta imediata
- **Custos**: Não gera custos de transação

### ✅ Testes
- **Cenários**: Aprovação, rejeição, cancelamento
- **Timeout**: Simula pagamentos que expiram
- **Erros**: Simula falhas de comunicação
- **Debugging**: Logs detalhados e rastreabilidade

### ✅ Integração
- **Compatibilidade**: Mantém interface do sistema real
- **Validações**: Respeita todas as regras de negócio
- **Transição**: Migração suave para produção

## ⚠️ Diferenças Importantes

### Checkout vs QR Code
- **Checkout** (`/orders/checkout`): Apenas cria o pedido com status `PENDING`
- **QR Code** (`/mock-payments/qr-code`): Gera QR Code para pagamento
- **Fluxo**: Checkout → QR Code → Simulação → Webhook → Atualização

### Mock vs Real
- **Mock** (`/mock-payments/*`): Sistema simulado para desenvolvimento
- **Real** (`/payments/*`): Integração real com Mercado Pago

## 🤝 Contribuição

Para contribuir com o sistema mockado:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Implemente** as mudanças
4. **Adicione** testes
5. **Execute** os testes
6. **Faça** o commit
7. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas:

1. **Issues**: Abra uma issue no GitHub
2. **Documentação**: Consulte este README
3. **Testes**: Execute `./scripts/test-mock-payments.sh`

---

**🎉 Sistema de Pagamentos Mockado - Pronto para uso!** 