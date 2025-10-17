-- ============================================
-- QUERIES DE DIAGNÓSTICO - Backend Payments
-- Fecha: 17 de octubre de 2025
-- ============================================

-- ============================================
-- 1. VERIFICAR DATOS EN BASE DE DATOS
-- ============================================

-- Contar total de registros
SELECT 
  'payments' as tabla,
  COUNT(*) as total_registros
FROM payments

UNION ALL

SELECT 
  'customers' as tabla,
  COUNT(*) as total_registros
FROM customers

UNION ALL

SELECT 
  'subscriptions' as tabla,
  COUNT(*) as total_registros
FROM subscriptions

UNION ALL

SELECT 
  'payment_tokens' as tabla,
  COUNT(*) as total_registros
FROM payment_tokens;


-- ============================================
-- 2. VERIFICAR ÚLTIMOS PAGOS
-- ============================================

-- Ver últimos 20 pagos
SELECT 
  p.id,
  p.merchant_transaction_id,
  p.payment_type,
  p.amount,
  p.currency,
  p.status,
  p.result_code,
  p.created_at,
  c.email as customer_email,
  CONCAT(c.given_name, ' ', c.surname) as customer_name
FROM payments p
INNER JOIN customers c ON p.customer_id = c.id
ORDER BY p.created_at DESC
LIMIT 20;


-- ============================================
-- 3. ESTADÍSTICAS POR ESTADO
-- ============================================

-- Distribución de pagos por estado
SELECT 
  status,
  COUNT(*) as cantidad,
  SUM(amount) as total_monto,
  MIN(amount) as monto_minimo,
  MAX(amount) as monto_maximo,
  AVG(amount) as monto_promedio
FROM payments
GROUP BY status
ORDER BY cantidad DESC;


-- ============================================
-- 4. ESTADÍSTICAS POR TIPO DE PAGO
-- ============================================

-- Distribución de pagos por tipo
SELECT 
  payment_type,
  COUNT(*) as cantidad,
  SUM(amount) as total_monto,
  MIN(created_at) as primer_pago,
  MAX(created_at) as ultimo_pago
FROM payments
GROUP BY payment_type
ORDER BY cantidad DESC;


-- ============================================
-- 5. PAGOS POR RANGO DE FECHAS
-- ============================================

-- Pagos de hoy
SELECT 
  COUNT(*) as pagos_hoy,
  SUM(amount) as total_hoy
FROM payments
WHERE created_at >= CURRENT_DATE;

-- Pagos de esta semana
SELECT 
  COUNT(*) as pagos_semana,
  SUM(amount) as total_semana
FROM payments
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Pagos de este mes
SELECT 
  COUNT(*) as pagos_mes,
  SUM(amount) as total_mes
FROM payments
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);


-- ============================================
-- 6. CLIENTES MÁS ACTIVOS
-- ============================================

-- Top 10 clientes por número de pagos
SELECT 
  c.id,
  c.email,
  CONCAT(c.given_name, ' ', c.surname) as nombre,
  COUNT(p.id) as total_pagos,
  SUM(p.amount) as total_gastado,
  MAX(p.created_at) as ultimo_pago
FROM customers c
INNER JOIN payments p ON c.id = p.customer_id
GROUP BY c.id, c.email, c.given_name, c.surname
ORDER BY total_pagos DESC
LIMIT 10;


-- ============================================
-- 7. VERIFICAR PAGOS DUPLICADOS
-- ============================================

-- Buscar merchant_transaction_id duplicados
SELECT 
  merchant_transaction_id,
  COUNT(*) as veces_repetido,
  STRING_AGG(id::text, ', ') as payment_ids
FROM payments
GROUP BY merchant_transaction_id
HAVING COUNT(*) > 1;


-- ============================================
-- 8. PAGOS PENDIENTES HACE MÁS DE 1 HORA
-- ============================================

-- Pagos que quedaron en PENDING y no se actualizaron
SELECT 
  p.id,
  p.merchant_transaction_id,
  p.amount,
  p.status,
  p.result_code,
  p.created_at,
  c.email,
  EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 as horas_pendiente
FROM payments p
INNER JOIN customers c ON p.customer_id = c.id
WHERE p.status = 'PENDING'
  AND p.created_at < NOW() - INTERVAL '1 hour'
ORDER BY p.created_at DESC;


-- ============================================
-- 9. SUSCRIPCIONES ACTIVAS
-- ============================================

-- Ver todas las suscripciones activas
SELECT 
  s.id,
  s.plan_type,
  s.amount,
  s.status,
  s.next_billing_date,
  s.failed_attempts,
  c.email as customer_email,
  CONCAT(c.given_name, ' ', c.surname) as customer_name,
  pt.brand as card_brand,
  pt.last4 as card_last4
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.id
LEFT JOIN payment_tokens pt ON s.token_id = pt.id
WHERE s.status = 'ACTIVE'
ORDER BY s.next_billing_date ASC;


-- ============================================
-- 10. SUSCRIPCIONES PRÓXIMAS A COBRAR
-- ============================================

-- Suscripciones que deben cobrarse en los próximos 7 días
SELECT 
  s.id,
  s.plan_type,
  s.amount,
  s.next_billing_date,
  EXTRACT(DAY FROM (s.next_billing_date - NOW())) as dias_restantes,
  c.email,
  CONCAT(c.given_name, ' ', c.surname) as customer_name
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.id
WHERE s.status = 'ACTIVE'
  AND s.next_billing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY s.next_billing_date ASC;


-- ============================================
-- 11. PAGOS CON ERRORES
-- ============================================

-- Pagos rechazados o fallidos con detalles
SELECT 
  p.id,
  p.merchant_transaction_id,
  p.payment_type,
  p.amount,
  p.status,
  p.result_code,
  p.result_description,
  p.created_at,
  c.email,
  CONCAT(c.given_name, ' ', c.surname) as customer_name
FROM payments p
INNER JOIN customers c ON p.customer_id = c.id
WHERE p.status IN ('REJECTED', 'FAILED')
ORDER BY p.created_at DESC
LIMIT 20;


-- ============================================
-- 12. TOKENS DE PAGO ACTIVOS
-- ============================================

-- Ver tokens de pago guardados
SELECT 
  pt.id,
  pt.brand,
  pt.last4,
  pt.expiry_month,
  pt.expiry_year,
  pt.is_active,
  c.email as customer_email,
  CONCAT(c.given_name, ' ', c.surname) as customer_name,
  COUNT(s.id) as suscripciones_activas
FROM payment_tokens pt
INNER JOIN customers c ON pt.customer_id = c.id
LEFT JOIN subscriptions s ON pt.id = s.token_id AND s.status = 'ACTIVE'
WHERE pt.is_active = true
GROUP BY pt.id, pt.brand, pt.last4, pt.expiry_month, pt.expiry_year, pt.is_active, c.email, c.given_name, c.surname
ORDER BY pt.created_at DESC;


-- ============================================
-- 13. VERIFICAR INTEGRIDAD DE DATOS
-- ============================================

-- Pagos sin cliente (no debería haber)
SELECT COUNT(*) as pagos_sin_cliente
FROM payments p
LEFT JOIN customers c ON p.customer_id = c.id
WHERE c.id IS NULL;

-- Suscripciones sin cliente (no debería haber)
SELECT COUNT(*) as suscripciones_sin_cliente
FROM subscriptions s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE c.id IS NULL;

-- Suscripciones sin token (no debería haber)
SELECT COUNT(*) as suscripciones_sin_token
FROM subscriptions s
LEFT JOIN payment_tokens pt ON s.token_id = pt.id
WHERE pt.id IS NULL;


-- ============================================
-- 14. ANÁLISIS DE INGRESOS
-- ============================================

-- Ingresos por día (últimos 30 días)
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as num_pagos,
  SUM(amount) as ingresos_total,
  AVG(amount) as ticket_promedio
FROM payments
WHERE status = 'APPROVED'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- Ingresos por mes (últimos 12 meses)
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  COUNT(*) as num_pagos,
  SUM(amount) as ingresos_total,
  AVG(amount) as ticket_promedio
FROM payments
WHERE status = 'APPROVED'
  AND created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;


-- ============================================
-- 15. BUSCAR PAGO ESPECÍFICO
-- ============================================

-- Por merchant transaction ID
-- REEMPLAZAR 'TXN_123' con el ID real
SELECT 
  p.*,
  c.email,
  CONCAT(c.given_name, ' ', c.surname) as customer_name,
  s.plan_type as subscription_plan,
  s.status as subscription_status
FROM payments p
INNER JOIN customers c ON p.customer_id = c.id
LEFT JOIN subscriptions s ON p.subscription_id = s.id
WHERE p.merchant_transaction_id = 'TXN_123';

-- Por email del cliente
-- REEMPLAZAR 'user@example.com' con el email real
SELECT 
  p.id,
  p.merchant_transaction_id,
  p.payment_type,
  p.amount,
  p.status,
  p.result_code,
  p.created_at
FROM payments p
INNER JOIN customers c ON p.customer_id = c.id
WHERE c.email = 'user@example.com'
ORDER BY p.created_at DESC;


-- ============================================
-- 16. LIMPIAR DATOS DE PRUEBA
-- ============================================

-- ⚠️ CUIDADO: Solo ejecutar en desarrollo/staging
-- NO ejecutar en producción sin antes hacer backup

-- Ver pagos de prueba (montos bajos)
SELECT 
  p.id,
  p.merchant_transaction_id,
  p.amount,
  p.status,
  p.created_at,
  c.email
FROM payments p
INNER JOIN customers c ON p.customer_id = c.id
WHERE p.amount <= 5.00
ORDER BY p.created_at DESC;

-- Eliminar pagos de prueba (COMENTADO POR SEGURIDAD)
-- DELETE FROM payments WHERE amount <= 5.00;


-- ============================================
-- 17. RESUMEN EJECUTIVO
-- ============================================

-- Dashboard completo
SELECT 
  (SELECT COUNT(*) FROM payments) as total_pagos,
  (SELECT COUNT(*) FROM payments WHERE status = 'APPROVED') as pagos_aprobados,
  (SELECT COUNT(*) FROM payments WHERE status = 'PENDING') as pagos_pendientes,
  (SELECT COUNT(*) FROM payments WHERE status IN ('REJECTED', 'FAILED')) as pagos_fallidos,
  (SELECT SUM(amount) FROM payments WHERE status = 'APPROVED') as ingresos_totales,
  (SELECT COUNT(*) FROM customers) as total_clientes,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'ACTIVE') as suscripciones_activas,
  (SELECT COUNT(*) FROM payment_tokens WHERE is_active = true) as tokens_activos;


-- ============================================
-- FIN
-- ============================================
