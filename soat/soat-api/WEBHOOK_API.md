# API de Webhook para Confirmação de Pagamento

## Visão Geral

O webhook é um endpoint que recebe notificações de confirmação de pagamento de provedores de pagamento externos (como Stripe, PayPal, etc.). Quando um pagamento é processado, o provedor envia uma notificação para este endpoint, que atualiza automaticamente o status do pedido no sistema.

## Endpoint do Webhook

### POST /webhooks/payment

Este endpoint recebe confirmações de pagamento e atualiza automaticamente o status do pedido.

#### Headers

- `Content-Type: application/json` (obrigatório)
- `X-Webhook-Signature` (opcional) - Assinatura para validação de segurança

#### Request Body

```json
{
  "orderId": "order-uuid-123",
  "paymentId": "pay-uuid-456",
  "status": "approved",
  "amount": 45.97,
  "currency": "BRL",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "signature": "webhook-signature-hash"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": "order-uuid-123",
  "paymentStatus": "APPROVED"
}
```

#### Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Invalid webhook payload",
  "error": "Bad Request"
}
```

#### Response (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

## Estrutura do Payload

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `orderId` | string | ID do pedido no sistema | `"order-uuid-123"` |
| `paymentId` | string | ID do pagamento do provedor | `"pay-uuid-456"` |
| `status` | string | Status do pagamento | `"approved"`, `"rejected"`, `"cancelled"` |
| `amount` | number | Valor do pagamento | `45.97` |
| `currency` | string | Moeda do pagamento | `"BRL"` |
| `timestamp` | string | Data/hora do pagamento | `"2024-01-15T10:35:00.000Z"` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `signature` | string | Assinatura para validação | `"webhook-signature-hash"` |

## Status de Pagamento Suportados

### Status do Webhook → Status do Sistema

- `"approved"` → `PaymentStatus.APPROVED`
- `"rejected"` → `PaymentStatus.REJECTED`
- `"cancelled"` → `PaymentStatus.CANCELLED`

## Validações Implementadas

### ✅ Validação de Payload
- **orderId obrigatório**: ID do pedido deve ser fornecido
- **paymentId obrigatório**: ID do pagamento deve ser fornecido
- **status válido**: Deve ser 'approved', 'rejected' ou 'cancelled'
- **amount válido**: Deve ser um número positivo
- **currency obrigatório**: Moeda deve ser fornecida
- **timestamp obrigatório**: Timestamp deve ser fornecido

### ✅ Validação de Segurança
- **Assinatura opcional**: Validação de assinatura se fornecida
- **Logs de segurança**: Registro de tentativas de acesso inválidas

### ✅ Validação de Negócio
- **Pedido existente**: Verifica se o pedido existe no sistema
- **Atualização automática**: Atualiza status do pedido automaticamente

## Exemplos de Uso

### 1. Pagamento Aprovado

```bash
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: valid-signature" \
  -d '{
    "orderId": "order-uuid-123",
    "paymentId": "pay-uuid-456",
    "status": "approved",
    "amount": 45.97,
    "currency": "BRL",
    "timestamp": "2024-01-15T10:35:00.000Z"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": "order-uuid-123",
  "paymentStatus": "APPROVED"
}
```

### 2. Pagamento Rejeitado

```bash
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid-123",
    "paymentId": "pay-uuid-456",
    "status": "rejected",
    "amount": 45.97,
    "currency": "BRL",
    "timestamp": "2024-01-15T10:35:00.000Z"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": "order-uuid-123",
  "paymentStatus": "REJECTED"
}
```

### 3. Pagamento Cancelado

```bash
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid-123",
    "paymentId": "pay-uuid-456",
    "status": "cancelled",
    "amount": 45.97,
    "currency": "BRL",
    "timestamp": "2024-01-15T10:35:00.000Z"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": "order-uuid-123",
  "paymentStatus": "CANCELLED"
}
```

## Fluxo de Processamento

### 1. Recebimento do Webhook
- Sistema recebe POST no endpoint `/webhooks/payment`
- Valida headers e estrutura do payload

### 2. Validação de Segurança
- Verifica assinatura se fornecida
- Valida formato e conteúdo do payload

### 3. Processamento do Pagamento
- Mapeia status do webhook para PaymentStatus
- Atualiza status do pedido no sistema
- Registra logs de processamento

### 4. Resposta
- Retorna confirmação de sucesso
- Inclui ID do pedido e status atualizado

## Configuração de Segurança

### Variáveis de Ambiente

```env
WEBHOOK_SECRET_KEY=your-secret-key-here
```

### Validação de Assinatura

O sistema suporta validação de assinatura para garantir que o webhook vem de uma fonte confiável:

```typescript
// Implementação básica - em produção, usar HMAC ou similar
validateWebhookSignature(payload: string, signature: string, secretKey: string): boolean
```

## Logs e Monitoramento

### Logs de Sucesso
```
[WebhookService] Processing payment webhook for order: order-uuid-123
[WebhookService] Payment status updated for order order-uuid-123 to APPROVED
[WebhookController] Payment webhook processed successfully for order: order-uuid-123
```

### Logs de Erro
```
[WebhookService] Error processing payment webhook for order order-uuid-123: Order not found
[WebhookController] Error processing payment webhook for order order-uuid-123: Invalid webhook payload
```

## Tratamento de Erros

### 400 Bad Request
- Payload inválido ou malformado
- Campos obrigatórios ausentes
- Status de pagamento inválido
- Assinatura inválida

### 404 Not Found
- Pedido não encontrado no sistema

### 500 Internal Server Error
- Erro interno do servidor
- Problemas de banco de dados

## Integração com Provedores de Pagamento

### Exemplo: Stripe Webhook

```json
{
  "orderId": "order-uuid-123",
  "paymentId": "pi_3OqX8X2eZvKYlo2C1gQZvKYl",
  "status": "approved",
  "amount": 4597,
  "currency": "brl",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "signature": "t=1705322100,v1=abc123..."
}
```

### Exemplo: PayPal Webhook

```json
{
  "orderId": "order-uuid-123",
  "paymentId": "PAY-123456789",
  "status": "approved",
  "amount": 45.97,
  "currency": "BRL",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

## Casos de Uso

### ✅ Pagamento Aprovado
1. Cliente faz checkout
2. Provedor processa pagamento
3. Provedor envia webhook com status "approved"
4. Sistema atualiza pedido para APPROVED
5. Pedido pode prosseguir para preparação

### ✅ Pagamento Rejeitado
1. Cliente faz checkout
2. Provedor processa pagamento
3. Provedor envia webhook com status "rejected"
4. Sistema atualiza pedido para REJECTED
5. Pedido não pode prosseguir

### ✅ Pagamento Cancelado
1. Cliente cancela pagamento
2. Provedor envia webhook com status "cancelled"
3. Sistema atualiza pedido para CANCELLED
4. Pedido não pode prosseguir

## Boas Práticas

### ✅ Implementação Recomendada
- **Validação de assinatura**: Sempre implementar em produção
- **Idempotência**: Webhook pode ser chamado múltiplas vezes
- **Logs detalhados**: Registrar todas as operações
- **Tratamento de erros**: Respostas claras e informativas
- **Timeout adequado**: Responder rapidamente (máximo 30s)

### ✅ Segurança
- **HTTPS obrigatório**: Sempre usar em produção
- **Validação de origem**: Verificar IP do provedor
- **Rate limiting**: Limitar requisições por IP
- **Monitoramento**: Alertas para falhas de webhook

### ✅ Resiliência
- **Retry automático**: Provedor deve reenviar webhooks falhados
- **Dead letter queue**: Armazenar webhooks que falharam
- **Monitoramento**: Dashboard para status dos webhooks
- **Backup**: Logs de todos os webhooks processados 