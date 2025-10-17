# Script de pruebas para verificar las correcciones del backend
# Fecha: 17 de octubre de 2025
# PowerShell version

$BASE_URL = "http://localhost:3000/api"

Write-Host "🧪 ===== TESTS DE CORRECCIONES BACKEND =====" -ForegroundColor Cyan
Write-Host ""

# Test 1: Historial de Pagos - Página 1
Write-Host "📋 Test 1: Historial de Pagos - Página 1" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/history-payments?page=1&pageSize=5" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ Retorna diferentes registros"
    Write-Host "  - ✓ page = 1"
    Write-Host "  - ✓ totalPages calculado correctamente"
    Write-Host ""
    $test1 = Read-Host "¿Test 1 pasó? (s/n)"
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    $test1 = "n"
}
Write-Host ""

# Test 2: Historial de Pagos - Página 2
Write-Host "📋 Test 2: Historial de Pagos - Página 2" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/history-payments?page=2&pageSize=5" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ Retorna registros DIFERENTES a página 1"
    Write-Host "  - ✓ page = 2"
    Write-Host ""
    $test2 = Read-Host "¿Test 2 pasó? (s/n)"
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    $test2 = "n"
}
Write-Host ""

# Test 3: Filtro por Status
Write-Host "📋 Test 3: Filtrar por status APPROVED" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/history-payments?status=APPROVED" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ Solo retorna pagos con status=APPROVED"
    Write-Host ""
    $test3 = Read-Host "¿Test 3 pasó? (s/n)"
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    $test3 = "n"
}
Write-Host ""

# Test 4: Búsqueda
Write-Host "📋 Test 4: Buscar por texto" -ForegroundColor Yellow
$search_term = Read-Host "Ingresa un término de búsqueda (nombre, cédula, email)"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/history-payments?search=$search_term" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ Retorna resultados que coinciden con '$search_term'"
    Write-Host ""
    $test4 = Read-Host "¿Test 4 pasó? (s/n)"
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    $test4 = "n"
}
Write-Host ""

# Test 5: Estadísticas
Write-Host "📊 Test 5: Estadísticas del dashboard" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/history-payments/stats" -Method Get
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ totalRevenue es un número"
    Write-Host "  - ✓ successfulPayments es un número"
    Write-Host "  - ✓ pendingPayments es un número"
    Write-Host "  - ✓ failedPayments es un número"
    Write-Host ""
    $test5 = Read-Host "¿Test 5 pasó? (s/n)"
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    $test5 = "n"
}
Write-Host ""

# Test 6: Checkout de Suscripción
Write-Host "💳 Test 6: Checkout de Suscripción (Plan Mensual `$19)" -ForegroundColor Yellow
Write-Host "Enviando request..."

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$body = @{
    customer = @{
        merchantCustomerId = "TEST_USER_$timestamp"
        email = "test$timestamp@example.com"
        givenName = "Test"
        middleName = "Usuario"
        surname = "Prueba"
        identificationDocType = "CC"
        identificationDocId = "1234567890"
        phone = "0987654321"
        street1 = "Av. Test 123"
        city = "Cuenca"
        state = "Azuay"
        country = "EC"
        postcode = "010101"
    }
    payment = @{
        merchantTransactionId = "TXN_$timestamp"
        paymentBrand = "VISA"
        amount = 19.00
        currency = "USD"
        planType = "MONTHLY"
        paymentType = "INITIAL"
    }
    returnUrl = "https://pay.animussociety.com/payment-success"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/payments/subscriptions/checkout" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ NO retorna error 500"
    Write-Host "  - ✓ Retorna checkoutId"
    Write-Host "  - ✓ Retorna status='PENDING'"
    Write-Host "  - ✓ Retorna redirectUrl o checkoutId válido"
    Write-Host ""
    $test6 = Read-Host "¿Test 6 pasó? (s/n)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ ERROR: Status Code $statusCode" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($statusCode -eq 500) {
        Write-Host "❌ ERROR: Retornó error 500 (Internal Server Error)" -ForegroundColor Red
    }
    $test6 = Read-Host "¿Test 6 pasó? (s/n)"
}
Write-Host ""

# Test 7: Checkout con Plan Anual
Write-Host "💳 Test 7: Checkout de Suscripción (Plan Anual `$49)" -ForegroundColor Yellow
Write-Host "Enviando request..."

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$body = @{
    customer = @{
        merchantCustomerId = "TEST_USER_$timestamp"
        email = "test$timestamp@example.com"
        givenName = "Test"
        middleName = "Usuario"
        surname = "Prueba"
        identificationDocType = "CC"
        identificationDocId = "1234567890"
        phone = "0987654321"
        street1 = "Av. Test 123"
        city = "Cuenca"
        state = "Azuay"
        country = "EC"
        postcode = "010101"
    }
    payment = @{
        merchantTransactionId = "TXN_$timestamp"
        paymentBrand = "VISA"
        amount = 49.00
        currency = "USD"
        planType = "YEARLY"
        paymentType = "INITIAL"
    }
    returnUrl = "https://pay.animussociety.com/payment-success"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/payments/subscriptions/checkout" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Verificar:" -ForegroundColor Green
    Write-Host "  - ✓ NO retorna error 500"
    Write-Host "  - ✓ Retorna checkoutId"
    Write-Host "  - ✓ Retorna status='PENDING'"
    Write-Host ""
    $test7 = Read-Host "¿Test 7 pasó? (s/n)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ ERROR: Status Code $statusCode" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($statusCode -eq 500) {
        Write-Host "❌ ERROR: Retornó error 500 (Internal Server Error)" -ForegroundColor Red
    }
    $test7 = Read-Host "¿Test 7 pasó? (s/n)"
}
Write-Host ""

# Test 8: Validación de Errores
Write-Host "🚨 Test 8: Validación de datos incompletos" -ForegroundColor Yellow
Write-Host "Enviando request con datos faltantes..."

$body = @{
    customer = @{
        email = "test@example.com"
    }
    payment = @{
        amount = 19.00
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/payments/subscriptions/checkout" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "❌ ERROR: Esperaba error 400, pero la petición fue exitosa" -ForegroundColor Red
    $test8 = "n"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ CORRECTO: Retornó error 400 (Bad Request)" -ForegroundColor Green
        Write-Host "Verificar:" -ForegroundColor Green
        Write-Host "  - ✓ Retorna mensaje de error descriptivo"
        Write-Host "  - ✓ NO retorna error 500"
        Write-Host ""
        $test8 = Read-Host "¿Test 8 pasó? (s/n)"
    } else {
        Write-Host "❌ ERROR: Esperaba error 400, recibió $statusCode" -ForegroundColor Red
        $test8 = "n"
    }
}
Write-Host ""

# Resumen
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE TESTS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test 1 (Historial P1):     $test1"
Write-Host "Test 2 (Historial P2):     $test2"
Write-Host "Test 3 (Filtro Status):    $test3"
Write-Host "Test 4 (Búsqueda):         $test4"
Write-Host "Test 5 (Estadísticas):     $test5"
Write-Host "Test 6 (Checkout Monthly): $test6"
Write-Host "Test 7 (Checkout Yearly):  $test7"
Write-Host "Test 8 (Validaciones):     $test8"
Write-Host ""

# Contar tests exitosos
$tests_passed = 0
if ($test1 -eq "s") { $tests_passed++ }
if ($test2 -eq "s") { $tests_passed++ }
if ($test3 -eq "s") { $tests_passed++ }
if ($test4 -eq "s") { $tests_passed++ }
if ($test5 -eq "s") { $tests_passed++ }
if ($test6 -eq "s") { $tests_passed++ }
if ($test7 -eq "s") { $tests_passed++ }
if ($test8 -eq "s") { $tests_passed++ }

Write-Host "✅ Tests exitosos: $tests_passed/8" -ForegroundColor Green

if ($tests_passed -eq 8) {
    Write-Host ""
    Write-Host "🎉 ¡TODOS LOS TESTS PASARON!" -ForegroundColor Green
    Write-Host "El backend está listo para deployment." -ForegroundColor Green
} elseif ($tests_passed -ge 6) {
    Write-Host ""
    Write-Host "⚠️  La mayoría de tests pasaron." -ForegroundColor Yellow
    Write-Host "Revisar los tests fallidos antes de deployment." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Varios tests fallaron." -ForegroundColor Red
    Write-Host "Revisar el código y corregir antes de deployment." -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
