#!/bin/bash
# Script de pruebas para verificar las correcciones del backend
# Fecha: 17 de octubre de 2025

BASE_URL="http://localhost:3000/api"

echo "🧪 ===== TESTS DE CORRECCIONES BACKEND ====="
echo ""

# Test 1: Historial de Pagos - Página 1
echo "📋 Test 1: Historial de Pagos - Página 1"
curl -s -X GET "$BASE_URL/history-payments?page=1&pageSize=5" | jq '.'
echo ""
echo "Verificar:"
echo "  - ✓ Retorna diferentes registros"
echo "  - ✓ page = 1"
echo "  - ✓ totalPages calculado correctamente"
echo ""
read -p "¿Test 1 pasó? (s/n): " test1
echo ""

# Test 2: Historial de Pagos - Página 2
echo "📋 Test 2: Historial de Pagos - Página 2"
curl -s -X GET "$BASE_URL/history-payments?page=2&pageSize=5" | jq '.'
echo ""
echo "Verificar:"
echo "  - ✓ Retorna registros DIFERENTES a página 1"
echo "  - ✓ page = 2"
echo ""
read -p "¿Test 2 pasó? (s/n): " test2
echo ""

# Test 3: Filtro por Status
echo "📋 Test 3: Filtrar por status APPROVED"
curl -s -X GET "$BASE_URL/history-payments?status=APPROVED" | jq '.'
echo ""
echo "Verificar:"
echo "  - ✓ Solo retorna pagos con status=APPROVED"
echo ""
read -p "¿Test 3 pasó? (s/n): " test3
echo ""

# Test 4: Búsqueda
echo "📋 Test 4: Buscar por texto"
read -p "Ingresa un término de búsqueda (nombre, cédula, email): " search_term
curl -s -X GET "$BASE_URL/history-payments?search=$search_term" | jq '.'
echo ""
echo "Verificar:"
echo "  - ✓ Retorna resultados que coinciden con '$search_term'"
echo ""
read -p "¿Test 4 pasó? (s/n): " test4
echo ""

# Test 5: Estadísticas
echo "📊 Test 5: Estadísticas del dashboard"
curl -s -X GET "$BASE_URL/history-payments/stats" | jq '.'
echo ""
echo "Verificar:"
echo "  - ✓ totalRevenue es un número"
echo "  - ✓ successfulPayments es un número"
echo "  - ✓ pendingPayments es un número"
echo "  - ✓ failedPayments es un número"
echo ""
read -p "¿Test 5 pasó? (s/n): " test5
echo ""

# Test 6: Checkout de Suscripción
echo "💳 Test 6: Checkout de Suscripción (Plan Mensual $19)"
echo "Enviando request..."

TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -X POST "$BASE_URL/payments/subscriptions/checkout" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer\": {
      \"merchantCustomerId\": \"TEST_USER_$TIMESTAMP\",
      \"email\": \"test$TIMESTAMP@example.com\",
      \"givenName\": \"Test\",
      \"middleName\": \"Usuario\",
      \"surname\": \"Prueba\",
      \"identificationDocType\": \"CC\",
      \"identificationDocId\": \"1234567890\",
      \"phone\": \"0987654321\",
      \"street1\": \"Av. Test 123\",
      \"city\": \"Cuenca\",
      \"state\": \"Azuay\",
      \"country\": \"EC\",
      \"postcode\": \"010101\"
    },
    \"payment\": {
      \"merchantTransactionId\": \"TXN_$TIMESTAMP\",
      \"paymentBrand\": \"VISA\",
      \"amount\": 19.00,
      \"currency\": \"USD\",
      \"planType\": \"MONTHLY\",
      \"paymentType\": \"INITIAL\"
    },
    \"returnUrl\": \"https://pay.animussociety.com/payment-success\"
  }")

echo "$RESPONSE" | jq '.'
echo ""

HTTP_CODE=$(echo "$RESPONSE" | jq -r '.statusCode // 200')

if [ "$HTTP_CODE" == "500" ]; then
  echo "❌ ERROR: Retornó error 500 (Internal Server Error)"
  echo ""
  read -p "¿Test 6 pasó? (s/n): " test6
else
  echo "Verificar:"
  echo "  - ✓ NO retorna error 500"
  echo "  - ✓ Retorna checkoutId"
  echo "  - ✓ Retorna status='PENDING'"
  echo "  - ✓ Retorna redirectUrl o checkoutId válido"
  echo ""
  read -p "¿Test 6 pasó? (s/n): " test6
fi
echo ""

# Test 7: Checkout con Plan Anual
echo "💳 Test 7: Checkout de Suscripción (Plan Anual $49)"
echo "Enviando request..."

TIMESTAMP=$(date +%s)
RESPONSE=$(curl -s -X POST "$BASE_URL/payments/subscriptions/checkout" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer\": {
      \"merchantCustomerId\": \"TEST_USER_$TIMESTAMP\",
      \"email\": \"test$TIMESTAMP@example.com\",
      \"givenName\": \"Test\",
      \"middleName\": \"Usuario\",
      \"surname\": \"Prueba\",
      \"identificationDocType\": \"CC\",
      \"identificationDocId\": \"1234567890\",
      \"phone\": \"0987654321\",
      \"street1\": \"Av. Test 123\",
      \"city\": \"Cuenca\",
      \"state\": \"Azuay\",
      \"country\": \"EC\",
      \"postcode\": \"010101\"
    },
    \"payment\": {
      \"merchantTransactionId\": \"TXN_$TIMESTAMP\",
      \"paymentBrand\": \"VISA\",
      \"amount\": 49.00,
      \"currency\": \"USD\",
      \"planType\": \"YEARLY\",
      \"paymentType\": \"INITIAL\"
    },
    \"returnUrl\": \"https://pay.animussociety.com/payment-success\"
  }")

echo "$RESPONSE" | jq '.'
echo ""

HTTP_CODE=$(echo "$RESPONSE" | jq -r '.statusCode // 200')

if [ "$HTTP_CODE" == "500" ]; then
  echo "❌ ERROR: Retornó error 500 (Internal Server Error)"
  echo ""
  read -p "¿Test 7 pasó? (s/n): " test7
else
  echo "Verificar:"
  echo "  - ✓ NO retorna error 500"
  echo "  - ✓ Retorna checkoutId"
  echo "  - ✓ Retorna status='PENDING'"
  echo ""
  read -p "¿Test 7 pasó? (s/n): " test7
fi
echo ""

# Test 8: Validación de Errores
echo "🚨 Test 8: Validación de datos incompletos"
echo "Enviando request con datos faltantes..."

RESPONSE=$(curl -s -X POST "$BASE_URL/payments/subscriptions/checkout" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer\": {
      \"email\": \"test@example.com\"
    },
    \"payment\": {
      \"amount\": 19.00
    }
  }")

echo "$RESPONSE" | jq '.'
echo ""

HTTP_CODE=$(echo "$RESPONSE" | jq -r '.statusCode // 400')

if [ "$HTTP_CODE" == "400" ]; then
  echo "✅ CORRECTO: Retornó error 400 (Bad Request)"
  echo "Verificar:"
  echo "  - ✓ Retorna mensaje de error descriptivo"
  echo "  - ✓ NO retorna error 500"
  echo ""
  read -p "¿Test 8 pasó? (s/n): " test8
else
  echo "❌ ERROR: Esperaba error 400, recibió $HTTP_CODE"
  read -p "¿Test 8 pasó? (s/n): " test8
fi
echo ""

# Resumen
echo ""
echo "======================================"
echo "📊 RESUMEN DE TESTS"
echo "======================================"
echo ""
echo "Test 1 (Historial P1):     $test1"
echo "Test 2 (Historial P2):     $test2"
echo "Test 3 (Filtro Status):    $test3"
echo "Test 4 (Búsqueda):         $test4"
echo "Test 5 (Estadísticas):     $test5"
echo "Test 6 (Checkout Monthly): $test6"
echo "Test 7 (Checkout Yearly):  $test7"
echo "Test 8 (Validaciones):     $test8"
echo ""

# Contar tests exitosos
tests_passed=0
[ "$test1" == "s" ] && ((tests_passed++))
[ "$test2" == "s" ] && ((tests_passed++))
[ "$test3" == "s" ] && ((tests_passed++))
[ "$test4" == "s" ] && ((tests_passed++))
[ "$test5" == "s" ] && ((tests_passed++))
[ "$test6" == "s" ] && ((tests_passed++))
[ "$test7" == "s" ] && ((tests_passed++))
[ "$test8" == "s" ] && ((tests_passed++))

echo "✅ Tests exitosos: $tests_passed/8"

if [ $tests_passed -eq 8 ]; then
  echo ""
  echo "🎉 ¡TODOS LOS TESTS PASARON!"
  echo "El backend está listo para deployment."
elif [ $tests_passed -ge 6 ]; then
  echo ""
  echo "⚠️  La mayoría de tests pasaron."
  echo "Revisar los tests fallidos antes de deployment."
else
  echo ""
  echo "❌ Varios tests fallaron."
  echo "Revisar el código y corregir antes de deployment."
fi

echo ""
echo "======================================"
