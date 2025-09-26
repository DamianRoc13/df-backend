# Pagos Recurrentes — **Guía operativa para el proyecto (Dataweb/Datafast v3.3)**

*Resumen técnico del documento “Pagos recurrentes – DATAWEB (Botón de pagos)” para integrarlo en el repo y que Copilot tenga el contexto.*

> Fuente base: guía oficial de “Pagos recurrentes” (versión 3.3, 2022). 

---

## 0) Contexto y alcance

* **Producto**: Dataweb (botón de pagos) con **modalidad recurrente** (cobro sin tarjetahabiente presente).
* **Enfoque**: cómo **tokenizar** y luego **cobrar de forma automática** usando el token.
* **Importante**: desde la v**3.3** se **elimina** la tokenización stand-alone. La tokenización se hace **durante la transacción inicial** (OneClick/registrations).
* **Responsabilidad del comercio**: el **flujo de cobros** (cuándo, cuánto, reintentos, etc.) y el **envío correcto de impuestos** (inicial y en cada recurrencia).
* **Anulaciones (recurrencias)**: **no** se anulan desde la interfaz del botón; se recomienda hacerlo por **BIP** (plataforma del adquirente).

---

## 1) Flujo de alto nivel

1. **Transacción inicial (con el cliente presente)**

   * Pagas con la **Payment Page** (widget).
   * Habilitas **creación de registro** (token).
   * Guardas el **token** (`registrations[0].id`) y lo **asocias a un cliente** en tu BD.

2. **Cobro recurrente (cliente ausente)**

   * Desde tu **backend** llamas a:

     ```
     POST /v1/registrations/{TOKEN}/payments
     ```
   * Envío mínimo:

     * `entityId`
     * `amount`, `currency`
     * `paymentType=DB`
     * **`recurringType=REPEATED`**
     * **`risk.parameters[USER_DATA1]=REPEATED`**
     * **Impuestos** (siempre, aun si 0):

       * `customParameters[SHOPPER_VAL_BASE0]`
       * `customParameters[SHOPPER_VAL_BASEIMP]`
       * `customParameters[SHOPPER_VAL_IVA]`
     * Parámetros fijos de Datafast:

       * `customParameters[SHOPPER_MID]`, `customParameters[SHOPPER_TID]`
       * `customParameters[SHOPPER_ECI]=0103910`
       * `customParameters[SHOPPER_PSERV]=17913101`
       * `customParameters[SHOPPER_VERSIONDF]=2`
     * Identificador único por intento: `merchantTransactionId`
     * (UAT) `testMode=EXTERNAL`

3. **Respuesta**

   * Obtienes un **JSON** con el resultado del pago recurrente (aprobado/rechazado/códigos).
   * **Persistir** el JSON completo y mapear `result.code` para UI/operaciones.

---

## 2) Tokenización (cómo obtener el token)

* **No** está permitido almacenar PAN/CVV (PCI).
* La **tokenización ocurre durante la transacción inicial** del botón (OneClick).
* El comercio debe **persistir el token** y asociarlo a **un único cliente** en su plataforma (relación 1:N: un cliente puede tener varios tokens).
* En la recurrencia se envían además los **datos no sensibles** (identificación, nombres, impuestos actualizados, etc.) que no forman parte del token.

---

## 3) Endpoint de Recurrencia (especificación)

**HTTP**

```
POST /v1/registrations/{token}/payments
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/x-www-form-urlencoded
```

**Body (form-urlencoded) — campos clave**

| Campo                                   | Valor/Formato                        | Obl. | Notas                                        |
| --------------------------------------- | ------------------------------------ | :--: | -------------------------------------------- |
| `entityId`                              | ID de entidad entregado por Datafast |  ✔︎  | Debe **corresponder** al Bearer del ambiente |
| `amount`                                | `#######.##`                         |  ✔︎  | En cada cobro (actualiza si cambia el plan)  |
| `currency`                              | `USD`                                |  ✔︎  | Según contrato                               |
| `paymentType`                           | `DB`                                 |  ✔︎  | Débito                                       |
| `recurringType`                         | `REPEATED`                           |  ✔︎  | **Obligatorio** para recurrencia             |
| `risk.parameters[USER_DATA1]`           | `REPEATED`                           |  ✔︎  | **Obligatorio**                              |
| `risk.parameters[USER_DATA2]`           | Nombre del comercio/canal            | Reco | Para trazabilidad                            |
| `merchantTransactionId`                 | string único por intento             |  ✔︎  | Idempotencia / auditoría                     |
| `customParameters[SHOPPER_MID]`         | MID                                  |  ✔︎  | Entregado por Datafast                       |
| `customParameters[SHOPPER_TID]`         | TID                                  |  ✔︎  | Entregado por Datafast                       |
| `customParameters[SHOPPER_ECI]`         | `0103910`                            |  ✔︎  | Fijo (guía)                                  |
| `customParameters[SHOPPER_PSERV]`       | `17913101`                           |  ✔︎  | Fijo (guía)                                  |
| `customParameters[SHOPPER_VERSIONDF]`   | `2`                                  |  ✔︎  | Fijo (guía)                                  |
| `customParameters[SHOPPER_VAL_BASE0]`   | `#######.##`                         |  ✔︎  | Impuesto base 0%                             |
| `customParameters[SHOPPER_VAL_BASEIMP]` | `#######.##`                         |  ✔︎  | Base imponible                               |
| `customParameters[SHOPPER_VAL_IVA]`     | `#######.##`                         |  ✔︎  | IVA                                          |
| `testMode` (solo UAT)                   | `EXTERNAL`                           |   —  | **No** enviar en producción                  |

**Nota sobre impuestos**
El comercio **debe enviar** correctamente los campos de impuestos en **la inicial** y en **cada recurrencia**. Si el valor del plan cambia, **ajustar impuestos** en el request correspondiente.

---

## 4) Respuesta de Recurrencia (qué guardar)

La función de ejemplo (en el documento) retorna un **JSON** con:

* `result.code`, `result.description` (estado)
* Datos de autorización/settlement según aplique
* Identificadores de la operación

**Buenas prácticas en persistencia**

* Guarda el **JSON completo** (texto) para auditoría.
* Indexa: `merchantTransactionId`, `token`, `result.code`, `createdAt`.
* Registra `amount`, **impuestos enviados**, y el **brand** asociado al token.

---

## 5) Operación: consola de control (sugerida)

El documento incluye un **mock de interfaz** para que el comercio gestione recurrencias:

* Lista de **suscripciones** (cliente, token, plan, próximo cobro).
* Acciones: **cobrar ahora**, **pausar**, **cancelar**.
* **Historial** con cada intento (fecha, `amount`, impuestos, `result.code`, JSON).
* **Filtros** por estado y **reintentos** (política propia del comercio).

---

## 6) Ambientes y credenciales

* **UAT/Pruebas**: `https://eu-test.oppwa.com`

  * `entityId` y `Bearer (Access Token)` de **pruebas**
  * `testMode=EXTERNAL`
  * Monto y tarjetas de prueba según indicaciones del adquirente

* **Producción**: `https://eu-prod.oppwa.com`

  * **Nuevas credenciales** (`entityId` y `Bearer` de producción)
  * **No** enviar `testMode`
  * Asegurar **TLS ≥ 1.2**, firma SHA-256, deshabilitar TLS obsoletos en el **edge** de tu servicio

---

## 7) Errores y mensajes típicos (diagnóstico rápido)

* **401 / `800.900.300 invalid authentication information`**

  * `Bearer` y `entityId` **no coinciden** o mal formados (saltos/espacios).
* **UnknownCheckoutError — `invalid or missing entity type`** (en widget)

  * `entityId` **no habilitado** para **Payment Page/Checkout Widgets** o la marca solicitada no está activa.
* **400 por impuestos**

  * Formato incorrecto (`#######.##`) o algún valor faltante.

> En todos los casos, **log** controlado (sin exponer credenciales) y **persistir** la respuesta del gateway.

---

## 8) Seguridad y cumplimiento (resumen mínimo)

* **PCI**: Nunca almacenar PAN/CVV. Trabajar con **tokens**.
* **TLS**: Forzar **mínimo TLS 1.2** (ideal 1.3) y suites seguras; HSTS en el borde.
* **BD no pública**: acceso **privado** (misma instancia/VPC privada; sin IP pública).
* **Idempotencia**: `merchantTransactionId` **único** por intento.
* **Validaciones**: Monto e impuestos con formato estricto; longitudes y tipos.
* **Auditoría**: Guardar el **JSON completo** de respuestas (aprobadas y rechazadas).
* **Anulaciones**: Para cobros recurrentes, gestionarlas por **BIP** (no por la interfaz del botón).

---

## 9) Snippet de referencia (server-side, formularios `x-www-form-urlencoded`)

> **Ejemplo genérico** (traducción del flujo PHP del documento a campos que debe enviar tu backend; ajusta a tu framework):

```bash
POST https://<eu-test|eu-prod>.oppwa.com/v1/registrations/{TOKEN}/payments
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/x-www-form-urlencoded

entityId=<ENTITY>
&amount=7.15
&currency=USD
&paymentType=DB
&recurringType=REPEATED
&risk.parameters[USER_DATA1]=REPEATED
&risk.parameters[USER_DATA2]=<NOMBRE_COMERCIO>
&merchantTransactionId=SUB_<UNICO>
&customParameters[SHOPPER_MID]=<MID>
&customParameters[SHOPPER_TID]=<TID>
&customParameters[SHOPPER_ECI]=0103910
&customParameters[SHOPPER_PSERV]=17913101
&customParameters[SHOPPER_VAL_BASE0]=0.00
&customParameters[SHOPPER_VAL_BASEIMP]=6.38
&customParameters[SHOPPER_VAL_IVA]=0.77
&customParameters[SHOPPER_VERSIONDF]=2
# En UAT únicamente:
&testMode=EXTERNAL
```

---

## 10) Checklist para “listo para producción”

* [ ] **Tokenización** en la transacción inicial (OneClick) y **token** guardado ↔ **cliente**.
* [ ] **Recurrencia** con `recurringType=REPEATED` + `risk.parameters[USER_DATA1]=REPEATED`.
* [ ] **Impuestos** siempre presentes y con formato `#######.##`.
* [ ] `merchantTransactionId` **único** por intento.
* [ ] **UAT** con `testMode=EXTERNAL`; **producción** sin `testMode`.
* [ ] **TLS ≥ 1.2**, BD sin público, logs sin secretos, JSON de respuesta persistido.
* [ ] Procedimiento de **anulaciones** vía **BIP** documentado para el equipo.

---

> **Nota**: esta guía resume y estructura lo indicado en el documento oficial de **Pagos Recurrentes** (v3.3). Para ejemplos visuales (figuras) y el ejemplo PHP original, consulta la fuente enlazada arriba. 
