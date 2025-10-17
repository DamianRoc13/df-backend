# df-backend (NestJS + pnpm) — Dataweb/Datafast

**Arquitectura:** vertical slices, modular monolith.  
**Objetivo:** cumplir al 100% los requisitos de la guía (modo PRUEBAS) y dejar comentado qué cambia para PRODUCCIÓN.

## 🔥 CORRECCIONES RECIENTES (17 Oct 2025)

**Se han aplicado correcciones críticas para producción:**
- ✅ **Checkout de suscripciones:** Error 500 corregido - DTO actualizado
- ✅ **Historial de pagos:** Logs de debugging agregados
- ✅ **Validaciones mejoradas:** Manejo robusto de errores

📖 **Ver documentación completa:** [`README-DEPLOYMENT.md`](./README-DEPLOYMENT.md)  
🧪 **Scripts de prueba:** `test-correcciones.sh` (Linux/Mac) o `test-correcciones.ps1` (Windows)

---

## TL;DR
- **Swagger:** http://localhost:3000/docs
- **Endpoints clave**
  - `POST /api/payments/checkouts` → Método 1 (crea `checkoutId`)
  - `POST /api/payments/subscriptions/checkout` → ✅ CORREGIDO - Checkout de suscripciones
  - `GET  /api/payments/status?resourcePath=...` → Método 2 (estado final JSON)
  - `GET  /api/history-payments` → ✅ MEJORADO - Historial con logs
  - `GET  /api/payments/verify?paymentId=...|merchantTransactionId=...`
  - `POST /api/payments/void` (RF)
- **ENV:** ver `.env.example` (usa `TEST_MODE=EXTERNAL` SOLO en pruebas; en prod se elimina)

---

## Requisitos de la guía y dónde se cumplen

### 1) TLS 1.2 + SHA-256 (pruebas y prod)
- **Requisito:** usar TLS ≥ 1.2 y firma SHA-256; deshabilitar TLS 1.1/1.0/SSL*.
- **Cumplimiento:** termina TLS en Nginx/ALB/CDN (`ssl_protocols TLSv1.2 TLSv1.3;`).  
  Si expones HTTPS desde Node, usa `minVersion: 'TLSv1.2'` en `main.ts` (comentado).

### 2) Conectividad al gateway (Anexo G)
- **Requisito:** probar desde el **host real** (donde corre Nest) con **cURL**.
- **Cumplimiento:** README (abajo) trae comandos de smoke test (TLS + POST).

### 3) Flujo de 2 métodos
- **Método 1 (crear checkoutId)**: `POST /v1/checkouts` con `application/x-www-form-urlencoded` y `Authorization: Bearer ...`.  
  - **Cumplido en:** `src/payments/payments.service.ts#createCheckout` (usa `qs.stringify`, **NO** JSON).
  - **Validaciones Fase 2** en DTO: nombres/longitudes, IP real, IDs, impuestos.
- **Método 2 (estado final)**: `GET {OPPWA_URL}{resourcePath}?entityId=...` → JSON.  
  - **Cumplido en:** `src/payments/payments.service.ts#getPaymentStatus` y `payments.controller.ts` (`/status`).

### 4) Fase 2 (pruebas contra el switch)
- **Auth:** `OPPWA_ENTITY_ID` y `OPPWA_BEARER` de pruebas (ENV).
- **Campos obligatorios (sin dummies):**  
  - Identidad: `customer.givenName|middleName|surname` con longitudes.  
  - IP del cliente: `customer.ip` (se captura de `X-Forwarded-For`).  
  - IDs: `customer.merchantCustomerId` y `merchantTransactionId` (ÚNICO).  
  - Impuestos: `customParameters[SHOPPER_VAL_BASE0|BASEIMP|IVA]` (#######.##).  
  - Datos comercio (SOLO test): `customParameters[SHOPPER_MID|TID]`.  
  - Banderas fijas: `SHOPPER_ECI`, `SHOPPER_PSERV`, `SHOPPER_VERSIONDF`.  
  - Riesgo obligatorio: `risk.parameters[USER_DATA2]` = nombre del comercio.
- **Cumplido en:** `CreateCheckoutDto` + `PaymentsService#createCheckout`.
- **Límite de pruebas:** amount ≤ **50.00** cuando `TEST_MODE` activo (validado en service).

### 5) Tokenización (One-Click)
- **Requisito:** si el cliente marca “guardar tarjeta” → `createRegistration`; guardar `registrationId`. Recompras → `registrations[0].id`.
- **Cumplido en:** `PaymentsService#createCheckout` (campos `oneClick` / `registrations`).  
  *(Endpoints de gestión de tokens no incluidos; añade un módulo `tokens/` si lo necesitas.)*

### 6) Verificador y Anulaciones
- **Verificador:** por `paymentId` o `merchantTransactionId`.
  - **Cumplido en:** `OperationsService#verifyBy` + controller `/payments/verify`.  
    *Incluye consulta directa al gateway por `paymentId`. Para `merchantTransactionId`, conecta tu persistencia.*
- **Anulación (RF):** usar el `id` de la transacción aprobada.
  - **Cumplido en:** `OperationsService#voidPayment` (POST `/v1/payments/{id}` con `paymentType=RF`).

### 7) Persistencia y auditoría
- **Requisito:** guardar el **JSON crudo** (aprobado o fallido) y marcar `procesada/no procesada` para reconciliar/verificar.
- **Cumplimiento:** este starter no incluye ORM; crea un módulo `persistence/` con `transactions`, `voids`, `tokens`.  
  Ejemplos de campos están documentados en el README (sección “Persistencia”).

### 8) Front (impacta certificación)
- **Requisito:** incluir **`https://www.datafast.com.ec/js/dfAdditionalValidations1.js`** al final de TODAS las páginas de checkout.
- **Cumplimiento:** responsabilidad del frontend (Astro). Deja un check en tu pipeline de QA.

---

## Estructura (vertical slices, modular monolith)

```text
src/
├─ main.ts                     # bootstrap + Swagger
├─ app.module.ts               # composición
├─ docs/swagger.ts             # /docs
├─ config/configuration.ts     # carga ENV
├─ common/http/axios.module.ts # HttpService con baseURL/timeouts
├─ payments/                   # Fase 1/2
│  ├─ payments.controller.ts   # /api/payments/checkouts, /status
│  ├─ payments.service.ts      # POST /v1/checkouts, GET resourcePath
│  └─ dto/...                  # CreateCheckoutDto (validaciones Fase 2)
└─ operations/                 # Operación
   ├─ operations.controller.ts # /api/payments/verify, /void
   └─ operations.service.ts    # verificador + RF
```

**Por qué esta estructura**
- Se alinea al **flujo** exigido por la guía (dos métodos + operación posterior).
- Facilita auditar y testear cada contrato (gateway vs. panel operativo).
- Permite crecer a módulos `tokens/`, `reconciliation/`, `persistence/` sin romper el core.

---

## Instalación y ejecución (pnpm)

```bash
pnpm i
cp .env.example .env   # completa tus credenciales de PRUEBAS
pnpm start:dev
# Swagger: http://localhost:3000/docs
```

## Comandos de conectividad (Anexo G)

```bash
# 1) Handshake TLS 1.2
curl -I --tlsv1.2 https://eu-test.oppwa.com/

# 2) Smoke POST (headers + form-urlencoded correctos)
curl -sS -D - -o /dev/null     -X POST "https://eu-test.oppwa.com/v1/checkouts"     -H "Authorization: Bearer $OPPWA_BEARER"     -H "Content-Type: application/x-www-form-urlencoded"     --data "entityId=$OPPWA_ENTITY_ID&amount=1.00&currency=USD&paymentType=DB"
```

## Producción — cambios a aplicar
- **Eliminar** `TEST_MODE` del `.env`.
- Configurar **OPPWA_URL/ENTITY_ID/BEARER** de producción.
- **TLS** en el edge (Nginx/ALB) con `ssl_protocols TLSv1.2 TLSv1.3;`, cert **SHA-256**.
- Sustituir `MID/TID` por los asignados en prod o **no enviarlos** si tu canal no los requiere.
- Agregar persistencia real y back-office de `void` y verificador.

---

## Persistencia sugerida (no incluida)
- `transactions`: `merchantTransactionId` (único), `paymentId`, `status`, `json`, `resourcePath`, timestamps.
- `voids`: `paymentId`, `requestedBy`, `reason`, `resultJson`, timestamps.
- `tokens`: `registrationId`, `userId`, `brand`, `last4`, `createdAt`, `deletedAt`.

---

## Notas
- **Body** del Método 1 es **form-urlencoded** (NO JSON).
- **IP real** del cliente: se captura de `X-Forwarded-For` en el controller.
- **Límite pruebas**: amount ≤ 50.00 si `TEST_MODE` está definido.
- **One-Click**: usa `oneClick=true` para enviar `createRegistration`; para recompras, pasa `registrations[]`.
- **Códigos**: mapea `result.code` en tu UI/Backoffice (p.ej., `000.200.100` creado; `000.000.000` aprobado).
