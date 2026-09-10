# Implementation Evidence: WS-1038 - Rounding error on POS sales checkout

## 1. Context & Execution Result
- **Status:** PASS 🟢

### Problem Context
A discrepancy was found in the POS between the frontend rounding display and the backend payment validation. When selling 35.5 units of a product at $3.65 (tax 0), the subtotal calculated is $129.575. The POS UI rounds this to $129.58, but upon attempting checkout, the backend rejects the payment as incorrect. The user is forced to manually override the cash payment field to $129.57 to finalize the invoice.

### Execution Instructions
The test suite was parameterized through a JSON seed to reproduce these exact calculations across both Retail and Restaurant modes.

To run the specific reproduction case locally (with a single worker):
```bash
npx playwright test --grep "@ws-1038" --workers=1
```

## 2. Files Modified / Created
- **Seed File**: `e2e/Wanqara/specific-cases/POS/rounding-cases.json`
- **Retail Spec**: `e2e/Wanqara/specific-cases/POS/POS-C/sales/rounding-error.spec.js`
- **Restaurant Spec**: `e2e/Wanqara/specific-cases/POS/POS-R/sales/rounding-error.spec.js`
- **Harness Support**: `e2e/Wanqara/regression/POS/harness/pos-product-options.js`

## 3. Implementation Strategy & Locators

We centralized the product option flows (modifying quantity, prices, and discounts) into `pos-product-options.js`. This allows the exact same flow to be reused across both standard regression suites and these new edge-case specific suites.

**Key implementations:**
- **Product Options Modal**: Target via `page.locator(".v-overlay__content .v-card")` and filter by either `/Opciones del Producto/i` or `/Informaci[oó]n Adicional de Producto/i` to maintain compatibility with both Retail and Restaurant Vue components.
- **Vuetify Inputs**: Extracted exact inputs navigating via `xpath=ancestor::div[1]/following-sibling::div[1]//input` relative to user-facing labels (`Precio Unitario (Sin Impuestos):`, etc.).
- **Client Override**: Injected `selectClientByCedula` to ensure all edge-case tests are billed to client `0000000001` per business rules.
- **Payment Toggles**: Asserted and explicitly disabled the `summary-action-btn` states for `Imprimir` and `Abrir Gaveta` to prevent hardware/PDF interrupts during headless test execution.
- **Error Interception**: The test clicks `Finalizar Venta`, explicitly waits for the `.v-snackbar` containing `/incorrectos/i`, overrides the `Monto` input via `getByLabel`, and finally intercepts the `POST` to `/api/v2/pos/sales` on the second submission to ensure the backend accepts the $129.57 fallback amount.
