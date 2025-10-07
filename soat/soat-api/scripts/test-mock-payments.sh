#!/bin/bash

# Script para testar o sistema de pagamentos mockado
# Este script demonstra o fluxo completo de pagamento usando o sistema mockado

set -e

# Configurações
API_BASE_URL="http://localhost:3000"
CUSTOMER_EMAIL="test@example.com"
CUSTOMER_CPF="12345678901"

echo "🚀 Iniciando teste do sistema de pagamentos mockado..."
echo "=================================================="

# 1. Criar um cliente
echo "📝 1. Criando cliente..."
CUSTOMER_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/customers/email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${CUSTOMER_EMAIL}\",
    \"name\": \"Cliente Teste\"
  }")

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "✅ Cliente criado com ID: $CUSTOMER_ID"

# 2. Criar produtos (se necessário)
echo "📦 2. Verificando produtos existentes..."
PRODUCTS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/products")
PRODUCTS_COUNT=$(echo $PRODUCTS_RESPONSE | jq '. | length')

if [ "$PRODUCTS_COUNT" -eq 0 ]; then
  echo "📦 Criando produtos de teste..."
  
  # Criar produto 1
  PRODUCT1_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/products" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Hambúrguer Clássico",
      "description": "Hambúrguer com carne, alface, tomate e queijo",
      "price": 15.90,
      "category": "Hambúrgueres"
    }')
  
  # Criar produto 2
  PRODUCT2_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/products" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Batata Frita",
      "description": "Porção de batatas fritas crocantes",
      "price": 8.50,
      "category": "Acompanhamentos"
    }')
  
  echo "✅ Produtos criados"
else
  echo "✅ Produtos já existem ($PRODUCTS_COUNT produtos)"
fi

# 3. Fazer checkout do pedido
echo "🛒 3. Fazendo checkout do pedido..."
CHECKOUT_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/orders/checkout" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"${CUSTOMER_ID}\",
    \"items\": [
      {
        \"productId\": \"1\",
        \"quantity\": 2
      },
      {
        \"productId\": \"2\",
        \"quantity\": 1
      }
    ]
  }")

ORDER_ID=$(echo $CHECKOUT_RESPONSE | jq -r '.order.id')
TOTAL_AMOUNT=$(echo $CHECKOUT_RESPONSE | jq -r '.totalAmount')
echo "✅ Pedido criado com ID: $ORDER_ID"
echo "💰 Valor total: R$ $TOTAL_AMOUNT"

# 4. QR Code já foi gerado automaticamente no checkout
echo "📱 4. QR Code já foi gerado automaticamente no checkout!"
PAYMENT_ID=$(echo $CHECKOUT_RESPONSE | jq -r '.qrCode.paymentId')
echo "✅ QR Code gerado automaticamente"
echo "🆔 Payment ID: $PAYMENT_ID"

# 5. Verificar status do pagamento (deve estar PENDING)
echo "🔍 5. Verificando status inicial do pagamento..."
PAYMENT_STATUS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}/payment-status")
INITIAL_STATUS=$(echo $PAYMENT_STATUS_RESPONSE | jq -r '.paymentStatus')
echo "📊 Status inicial: $INITIAL_STATUS"

# 6. Simular aprovação do pagamento
echo "✅ 6. Simulando aprovação do pagamento..."
APPROVAL_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/mock-payments/simulate-approval/${PAYMENT_ID}")
echo "✅ Pagamento aprovado: $(echo $APPROVAL_RESPONSE | jq -r '.message')"

# Aguardar um pouco para o processamento
sleep 2

# 7. Verificar status do pagamento (deve estar APPROVED)
echo "🔍 7. Verificando status após aprovação..."
PAYMENT_STATUS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}/payment-status")
FINAL_STATUS=$(echo $PAYMENT_STATUS_RESPONSE | jq -r '.paymentStatus')
IS_APPROVED=$(echo $PAYMENT_STATUS_RESPONSE | jq -r '.isApproved')
echo "📊 Status final: $FINAL_STATUS"
echo "✅ Aprovado: $IS_APPROVED"

# 8. Verificar pedidos ativos (para cozinha)
echo "👨‍🍳 8. Verificando pedidos ativos para cozinha..."
ACTIVE_ORDERS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/orders/active")
ACTIVE_ORDERS_COUNT=$(echo $ACTIVE_ORDERS_RESPONSE | jq '. | length')
echo "📋 Pedidos ativos: $ACTIVE_ORDERS_COUNT"

if [ "$ACTIVE_ORDERS_COUNT" -gt 0 ]; then
  echo "📋 Detalhes do primeiro pedido ativo:"
  echo $ACTIVE_ORDERS_RESPONSE | jq '.[0] | {orderId: .order.id, status: .order.status, paymentStatus: .order.paymentStatus, totalAmount: .totalAmount}'
fi

# 9. Atualizar status do pedido para IN_PREPARATION
echo "👨‍🍳 9. Atualizando status do pedido para IN_PREPARATION..."
UPDATE_STATUS_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/orders/${ORDER_ID}/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PREPARATION"
  }')

echo "✅ Status atualizado: $(echo $UPDATE_STATUS_RESPONSE | jq -r '.status')"

# 10. Listar pagamentos pendentes
echo "📋 10. Listando pagamentos pendentes..."
PENDING_PAYMENTS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/mock-payments/pending")
PENDING_COUNT=$(echo $PENDING_PAYMENTS_RESPONSE | jq '.payments | length')
echo "📊 Pagamentos pendentes: $PENDING_COUNT"

echo ""
echo "🎉 Teste do sistema de pagamentos mockado concluído com sucesso!"
echo "=================================================="
echo ""
echo "📝 Resumo do teste:"
echo "   - Cliente criado: $CUSTOMER_ID"
echo "   - Pedido criado: $ORDER_ID"
echo "   - Payment ID: $PAYMENT_ID"
echo "   - Status inicial: $INITIAL_STATUS"
echo "   - Status final: $FINAL_STATUS"
echo "   - Pedidos ativos: $ACTIVE_ORDERS_COUNT"
echo ""
echo "🔗 Endpoints utilizados:"
echo "   - POST /customers/email"
echo "   - POST /orders/checkout"
echo "   - POST /mock-payments/qr-code"
echo "   - GET /orders/{id}/payment-status"
echo "   - POST /mock-payments/simulate-approval/{paymentId}"
echo "   - GET /orders/active"
echo "   - POST /orders/{id}/status"
echo "   - GET /mock-payments/pending"
echo ""
echo "💡 Para testar outros cenários:"
echo "   - Rejeição: POST /mock-payments/simulate-rejection/{paymentId}"
echo "   - Cancelamento: POST /mock-payments/simulate-cancellation/{paymentId}"
echo "   - Status do pagamento: GET /mock-payments/status/{paymentId}" 