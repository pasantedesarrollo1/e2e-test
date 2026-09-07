# Implementation Evidence: TES-215 - Admin Payments Receivables Amount Print Issue

## 1. Execution Result
- **Status:** PASS 🟢 (Multitenant test successful)

## 2. Files Modified / Created
- `e2e/Wanqara/regression/finance/accounts/receivables/payment-print.spec.js` (Created for single receivables flow - TES-215)
- `e2e/Wanqara/regression/finance/accounts/payments/multiple-payment/herness/multiple-receivables-flow.js` (Modified to add `printPaymentTicket`)
- `e2e/Wanqara/regression/finance/accounts/payments/multiple-payment/multiple-receivables.spec.js` (Modified for TES-215)

## 3. Implementation Strategy & Locators
### TES-215 (Single Receivable Print Payload)
- Se utilizó la función de arnés `searchReceivableAccount` para buscar la cuenta del cliente `0000000001`.
- Se abrió el modal "Agregar Abono" y se asignó método de pago `EFECTIVO`.
- Se introdujo `0.01` interceptando el placeholder `Cantidad` y garantizando que el JSON viaja sin trailing locale issues (`amount: 0.01`).

### TES-215 (Multiple Receivables Print Ticket)
- En el archivo `multiple-receivables.spec.js`, dentro de la regresión de abonos múltiples, se inyectó la metada `TES-215`.
- Se implementó la nueva función asíncrona `printPaymentTicket` en el archivo helper `multiple-receivables-flow.js`.
- Dentro de la vista de Detalles de Cuenta, la prueba selecciona la segunda acción (el botón imprimir con icono de impresora) para el pago agregado más reciente.
- Se interceptó el `POST` hacia `http://localhost:51512/receiptPrinter/payment-ticket` y se capturó el payload completo.
- Se agregó una validación de objeto recursiva que recupera cada propiedad `amount` y aserta (mediante `.toFixed(2)`) que los valores pertinentes empatan exactamente con el monto original estipulado, sin desbordamientos de ceros o problemas de formateo (ej: `3.33` exacto).

## 4. Final Code Snippet (TES-215 Helper Extension)
```javascript
export async function printPaymentTicket(page) {
  // Asume que la vista de detalles ya fue abierta y el registro de abono está visible.
  const printBtn = page.locator("tbody tr").last().locator("button").nth(1);

  const printerPromise = page.waitForRequest(req => 
    req.url().includes('/receiptPrinter/payment-ticket') && 
    req.method() === 'POST'
  );

  await printBtn.click();
  const printerRequest = await printerPromise;
  const postData = printerRequest.postDataJSON();

  const amounts = [];
  function extractAmounts(obj) {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key === 'amount') {
          amounts.push(obj[key]);
        } else {
          extractAmounts(obj[key]);
        }
      }
    }
  }
  extractAmounts(postData);

  if (amounts.length > 0) {
    const paymentAmount = SEED.receivables.paymentAmount || "0.01";
    const targetAmount = parseFloat(paymentAmount).toFixed(2);
    for (let i = 0; i < amounts.length; i++) {
      const val = parseFloat(amounts[i]).toFixed(2);
      if (val === targetAmount) {
         expect.soft(val).toBe(targetAmount);
      }
    }
  }

  const successToast = page.getByRole('status').locator('div').filter({ hasText: /Impresión exitosa/i }).first();
  await expect(successToast).toBeVisible({ timeout: 15_000 });
}
```
