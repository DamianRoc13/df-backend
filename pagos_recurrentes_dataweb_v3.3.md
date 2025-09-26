
# Pagos recurrentes — DATAWEB (BOTÓN DE PAGOS)

**Autor:** Andrés Flores  
**Año:** 2022

## Historial de versiones
| Fecha | Versión | Descripción |
|---|---|---|
| 2019-08-26 | 1.0 | Documento inicial |
| 2020-06-23 | 1.1 | Actualización de códigos de ejemplo |
| 2020-09-11 | 3.0 | Actualización de códigos por nueva versión del botón de pagos (3.0) |
| 2021-06-01 | 3.1 | Se agrega campo `risk.parameters[USER_DATA1]=REPEATED` |
| 2021-09-27 | 3.2 | Modificación de imágenes de ejemplo: ya no existe `authentication.entityId`, solo `entityId` |
| 2022-04-01 | 3.3 | Eliminación del método de tokenización stand-alone |

---

## 1. Introducción
El producto Dataweb procesa transacciones normales generadas desde la interfaz web; adicionalmente ofrece la modalidad **recurrente**, que permite realizar cobros automáticos sin que el tarjetahabiente esté presente.

## 2. Responsabilidades
Datafast proporciona herramientas para **tokenización** garantizando la seguridad de datos sensibles; el comercio es responsable del **flujo de cobros** (alta/baja, frecuencia, reintentos) y del **envío correcto de impuestos** tanto en la transacción inicial como en cada recurrencia.

### 2.1 Sobre los impuestos
Si existe incremento en pagos recurrentes, el comercio debe **modificar los campos de impuestos** enviados en el request correspondiente.

## 3. Anulaciones
Los pagos recurrentes **no se pueden anular desde la interfaz**. Se recomienda realizarlas desde **BIP**.

## 4. Tokenización
Por normas PCI ninguna entidad no certificada puede almacenar datos completos/parciales de tarjetas. La tokenización se realiza **durante la transacción inicial** (OneClick). El token asocia datos sensibles de la tarjeta; otros campos (cédula, nombres, etc.) se envían en la recurrencia.

Para tokenizar en el momento de la transacción, revisar la guía del botón de pagos (sección OneClickCheckout).

## 5. Pago recurrente

### 5.1 Asociación de tokens
Cada **token** debe asociarse a un **único ID de cliente** dentro del comercio. Diseñar la tabla/relación en la base de datos acorde a los requerimientos.

### 5.2 Endpoint de recurrencia
```
POST /v1/registrations/{TOKEN}/payments
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/x-www-form-urlencoded
```

### 5.3 Parámetros requeridos del comercio y fiscales
- `entityId`: ID de entidad otorgado por Datafast.
- **Impuestos** (formato `#######.##`):
  - `customParameters[SHOPPER_VAL_BASE0]` — valores **no gravados**.
  - `customParameters[SHOPPER_VAL_BASEIMP]` — **base imponible** (gravada).
  - `customParameters[SHOPPER_VAL_IVA]` — **valor de impuesto** (p. ej. IVA).

**Ejemplo de desglose de compra (monto total $3.12):**
- Base imponible: $1.00 → IVA $0.12 → Subtotal $1.12  
- Base 0%: $2.00  
- **Total**: $3.12

Campos a enviar en ese ejemplo:
```txt
customParameters[SHOPPER_VAL_BASE0]=2.00
customParameters[SHOPPER_VAL_BASEIMP]=1.00
customParameters[SHOPPER_VAL_IVA]=0.12
```

- **MID/TID** (identificadores del comercio/terminal):  
  `customParameters[SHOPPER_MID]` y `customParameters[SHOPPER_TID]`
- **Identificadores fijos**:  
  `customParameters[SHOPPER_ECI]=0103910`  
  `customParameters[SHOPPER_PSERV]=17913101`  
  `customParameters[SHOPPER_VERSIONDF]=2`
- **Risk parameters**:  
  `risk.parameters[USER_DATA2]=<NombreComercio>` (identifica el comercio en la transacción)

### 5.4 Campos obligatorios de recurrencia
- `amount`, `currency`, `paymentType=DB`
- `recurringType=REPEATED`
- `risk.parameters[USER_DATA1]=REPEATED`
- `merchantTransactionId` **único por intento**
- (Solo UAT) `testMode=EXTERNAL`

### 5.5 Ejemplo de request en PHP (referencial)
```php
function request() {
  $url = "https://test.oppwa.com/v1/registrations/".$token."/payments";

  $data = "entityId=8a8294185a65bf5e015a6c8b89a10d8d" .
          "&amount=1.12" .
          "&currency=USD" .
          "&paymentType=DB" .
          "&risk.parameters[USER_DATA2]=PagoRapidoDF" . // Nombre de canal distinto al principal
          "&recurringType=REPEATED" .
          "&risk.parameters[USER_DATA1]=REPEATED" .
          "&merchantTransactionId=transaction_".$trx . // identificador incremental
          "&customParameters[SHOPPER_MID]=1000000505" .
          "&customParameters[SHOPPER_TID]=PD100406" .
          "&customParameters[SHOPPER_ECI]=0103910" .
          "&customParameters[SHOPPER_PSERV]=17913101" .
          "&customParameters[SHOPPER_VAL_BASE0]=".$base0 .
          "&customParameters[SHOPPER_VAL_BASEIMP]=".$base12 .
          "&customParameters[SHOPPER_VAL_IVA]=".$valoriva .
          "&customParameters[SHOPPER_VERSIONDF]=2";

  $data .= "&testMode=EXTERNAL"; // UAT únicamente

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization:Bearer <ACCESS_TOKEN>'));
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // EN PRODUCCIÓN: true
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  $responseData = curl_exec($ch);
  if (curl_errno($ch)) {
    return curl_error($ch);
  }
  curl_close($ch);
  return $responseData;
}
```

### 5.6 Respuesta
La ejecución retorna un **JSON** (aprobado/rechazado) con campos de resultado. (Persistir el JSON completo para auditoría).

---

## 6. Ambientes y credenciales
- **Pruebas** (`eu-test.oppwa.com`): usar `entityId`/`Bearer` de UAT y `testMode=EXTERNAL`.
- **Producción** (`eu-prod.oppwa.com`): usar **nuevas credenciales**; **no** enviar `testMode`.

---

## 7. Conectividad (prueba en servidor)
Ejecutar el script de conectividad (Anexo G) en el **servidor** donde residirá el botón de pagos. Puede requerir **cURL** habilitado.

---

## 8. Notas de seguridad mínimas
- **Nunca** almacenar PAN/CVV. Usar **token**.  
- **TLS ≥ 1.2** (ideal 1.3) y suites modernas en el perímetro.  
- **Idempotencia** con `merchantTransactionId` único.  
- **Validación** estricta de montos/impuestos (`#######.##`).  
- **Base de datos** sin acceso público (privada).  
- **Logs** sin credenciales; guardar **JSON** de respuesta.

---

## 9. Anexo (fragmentos útiles)

### Node.js — obtener checkoutId (referencial)
```js
const https = require('https');
const querystring = require('querystring');

const request = async () => {
  const path = '/v1/checkouts';
  const data = querystring.stringify({
    entityId: '8a8294174b7ecb28014b9699220015ca',
    amount: '92.00',
    currency: 'EUR',
    paymentType: 'DB'
  });
  const options = {
    port: 443,
    host: 'eu-test.oppwa.com',
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length,
      'Authorization': 'Bearer <ACCESS_TOKEN>'
    }
  };
  // ...
};
```

### Python — consultar estado (referencial)
```py
import urllib, urllib2, json

def request():
    url = "https://eu-test.oppwa.com/v1/checkouts/{id}/payment"
    url += '?entityId=8a829418533cf31d01533d06f2ee06fa'
    opener = urllib2.build_opener(urllib2.HTTPHandler)
    req = urllib2.Request(url, data='')
    req.add_header('Authorization', 'Bearer <ACCESS_TOKEN>')
    req.get_method = lambda: 'GET'
    res = opener.open(req)
    return json.loads(res.read())
```

> **Importante:** los ejemplos anteriores son **referenciales**, ajusta credenciales/entidad/moneda y **no desactives** `SSL_VERIFYPEER` en producción.

---

## 10. Checklist de integración
- [ ] Tokenización en transacción inicial y token asociado a cliente.
- [ ] Recurrencia con `recurringType=REPEATED` + `risk.parameters[USER_DATA1]=REPEATED`.
- [ ] Impuestos enviados en **cada** pago, formato `#######.##`.
- [ ] `merchantTransactionId` único por intento.
- [ ] UAT con `testMode=EXTERNAL`; producción sin `testMode`.
- [ ] TLS ≥ 1.2; BD privada; logs sin secretos; JSON persistidos.
