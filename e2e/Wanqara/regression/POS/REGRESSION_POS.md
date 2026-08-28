# Regression — POS Reference

**Specs location:** `e2e/Wanqara/regression/POS/`
**Playwright projects:** `POS-Retail`, `POS-Restaurant`, `Admin-Inventory`
**Test match patterns:**
- `POS-Retail` → `/Wanqara/regression/POS/(POS-C|common)/.*\.spec\.js/`
- `POS-Restaurant` → `/Wanqara/regression/POS/POS-R/.*\.spec\.js/`
**Tag:** `@regression`
**Run command:** `npx playwright test --project=POS-Retail --project=POS-Restaurant`

---

## Folder structure

```
regression/POS/
├── common/                        ← specs that run in BOTH retail and restaurant
│   ├── cash-movements.spec.js
│   ├── sale-cart.spec.js
│   ├── sale-financial-precision.spec.js
│   ├── sale-options.spec.js
│   ├── sale-product-options.spec.js
│   ├── sale-quotations.spec.js
│   └── sale-with-client.spec.js
├── POS-C/                         ← retail-only specs
│   └── sale-inventory-dispatch.spec.js
├── POS-R/                         ← restaurant-only specs (require Chef credentials)
│   ├── change-order-status-flow.spec.js
│   ├── close-orders-flow.spec.js
│   ├── close-orders-from-options.spec.js
│   ├── collect-orders-flow.spec.js
│   ├── delivery-flow.spec.js
│   ├── remove-products-flow.spec.js
│   ├── separate-order-flow.spec.js
│   ├── update-order-flow.spec.js
│   └── harness/                   ← POS-R-specific helpers
│       ├── chef-orders-flow.js
│       ├── pos-change-order-status.js
│       ├── pos-close-order.js
│       ├── pos-delivery-flow.js
│       ├── pos-orders-common.js
│       ├── pos-remove-products.js
│       └── pos-separate-order.js
└── harness/                       ← shared helpers for common + POS-C + POS-R
    ├── pos-financial-assertions.js
    ├── pos-fixtures.js
    ├── pos-payment.js
    ├── pos-product-options.js
    ├── pos-products.js
    ├── pos-sale-flow.js
    └── pos-search.js
```

---

## Auth identities used

| Identity | `storageState` file | Subsidiary | Dispatch |
|---|---|---|---|
| `retail` | `retail-session.json` | Wanqara Comercios 100 | No |
| `dispatch` | `dispatch-session.json` | Wanqara Comercios Dispatch 101 | Yes |
| `restaurant` | `restaurant-session.json` | Wanqara Restaurant 102 | No |

Sessions are pre-minted by the `setup` project (`auth.setup.js`). If a session expires mid-run, `ensureAuthenticated` retries login up to 3 times (`MAX_SESSION_REPAIRS`).

**`common/` specs** loop over `[{ name: 'Retail', authType: 'retail', fixture: 'posPage' }, { name: 'Restaurant', authType: 'restaurant', fixture: 'posRestaurantPage' }]` and produce two `test.describe` groups per spec file — one per environment.

**`POS-C/` specs** run under `POS-Retail` project only. `sale-inventory-dispatch.spec.js` uses both `retail` and `dispatch` identities within the same file via `test.use({ storageState: getSessionPath(...) })`.

**`POS-R/` specs** always use `restaurant`. They additionally require Chef credentials (`requireChefCredentials(test)`) and interact with the Chef app (`PLAYWRIGHT_CHEF_URL`) to create orders before testing POS flows.

---

## Shared infrastructure — `harness/` (POS-level)

These helpers are used across `common/`, `POS-C/`, and `POS-R/`.

### `pos-fixtures.js`

Exports a custom `test` object extending Playwright's base with two fixtures:

| Fixture | authType | Entry point | Setup headroom added |
|---|---|---|---|
| `posPage` | `retail` | `/pos/home` | +30 000 ms |
| `posRestaurantPage` | `restaurant` | `/pos/restaurant-home` | +90 000 ms |

Both fixtures call `ensureAuthenticated` then `withSessionWatchdog` to assert `Cliente:` is visible before handing the page to the test. `common/` and `POS-C/` specs import `test` from this file instead of `@playwright/test`.

**POS-R specs do NOT use these fixtures** — they call `navigateToRestaurantPOS` from `pos-orders-common.js` directly.

### `pos-search.js`

`searchAndSelectProduct(page, { name, searchTerm })`

- `searchTerm = null` → fills `#searchInput` with `name`, presses Enter, then clicks the matching `.v-card`.
- `searchTerm = <code>` → toggles the search mode button from "Nombre" to "Código" first, then fills and presses Enter (no card click needed — code search selects directly).

### `pos-payment.js`

`completePayment(page, { paymentMethod, printTicket, openDrawer })`

- Reads `.summary-action-btn` cards for "Imprimir Ticket" and "Abrir Gaveta"; toggles each to `active` or `inactive` as requested.
- Clicks the payment method text (`EFECTIVO` by default).
- Clicks "Finalizar Venta" and waits for `POST /api/v2/pos/sales → 200`.
- Asserts snackbar "Venta Realizada".

### `pos-sale-flow.js`

| Export | Purpose |
|---|---|
| `runPosSaleFlow(page, opts)` | Full POS sale: optional navigation to `/pos/home`, optional document-type selection, product search, optional `afterProductSelect` / `beforeFinish` hooks, click "Terminar Venta", then `completePayment`. |
| `captureSaleMutation(page)` | Returns a `waitForRequest` promise that resolves when `POST /api/v2/pos/sales` or `POST /api/v2/pos/sales/restaurant` is intercepted. Used to capture the request body for financial precision assertions. |
| `selectClientByCedula(page, cedula)` | Fills the "Ingresa Cédula o RUC" input, presses Enter, handles the client-confirmation modal (including the identity-type disambiguation flow when the backend returns an alert), and asserts snackbar "Cliente asignado correctamente". |
| `openDrawer(page, triggerLocator, filterText)` | Clicks `triggerLocator`, waits for the matching `.v-navigation-drawer`, returns it. |
| `closeDrawer(page, filterText)` | Clicks the close button inside the matching drawer and asserts `inert` attribute. |
| `navigateToSavedSales(page, drawer)` | Clicks "Ventas Guardadas" inside the drawer, waits for `/pos/saved-sales`. |
| `expandAndRecoverFirstSavedSale(page)` | Clicks the first "Recuperar" button and waits for `/pos/(restaurant-)?home`. |

### `pos-products.js`

Exports product list constants and two interaction helpers:

| Export | Purpose |
|---|---|
| `STANDARD_PRODUCTS` | Array of 14 entries — 7 product types by name + same 7 by code. |
| `SERIES_PRODUCTS` | 2 entries — serie by name, serie by code. |
| `TALLA_COLOR_PRODUCTS` | 3 entries — tallaColor by name, by parent code, by variant code. |
| `ALL_PRODUCTS` | `STANDARD_PRODUCTS + SERIES_PRODUCTS`. |
| `selectFirstVariant(page)` | Handles the "Variantes encontradas" modal: clicks "Agregar" on the first row, then "Agregar Selección". |
| `selectFirstSerie(page)` | Handles the series-selection modal: clicks the first `.tw-font-mono.tw-text-sm` entry, then "Guardar". |

### `pos-product-options.js`

Five step-functions for the "Opciones del Producto" modal, used in `sale-product-options.spec.js`:

| Export | Action |
|---|---|
| `openProductOptions(page)` | Clicks the solar-icon button, asserts the dialog visible, returns it. |
| `setQuantityInOptions(page, dialog, quantity)` | Fills the first `input[type='number']`. |
| `setUnitPriceInOptions(page, dialog, price)` | Fills the first `input[type='text']`. |
| `setDiscountInOptions(page, dialog, discount, discountType)` | Clicks the "Fijo" or "Porcentaje" chip, fills the second number input. |
| `selectPriceType(page, dialog, priceLabel)` | Clicks the matching price button and asserts `selected-price-option` class. |
| `saveProductOptions(page, dialog)` | Clicks "Guardar" and asserts dialog is gone. |

### `pos-financial-assertions.js`

The financial precision testing engine. All discount/surcharge precision values come from `SEED.discount.precision` and `SEED.surcharge.precision` in `harness/seed.js`.

| Export | Purpose |
|---|---|
| `PRECISION_CASES` | Array of 2 cases: `estandar` (no client required) and `combo` (requires `consumidorFinal`). Used by `sale-financial-precision.spec.js` to generate one test per product type per environment. |
| `runFinancialPrecisionFlow(page, opts)` | Full flow: optional client assignment, add product, optional afterProductSelect, optional quantity set, apply modifier, holiday-IVA detection (switches to `precisionHoliday` values if "IVA DIFERENCIADO APLICADO" is visible), assert panel UI, finalize and assert. |
| `applyGeneralDiscount(page, rate)` | Clicks "Descuento General", fills the rate in the dialog, clicks "Asignar descuento". Rate defaults to `SEED.discount.rate`. |
| `applyManualSurcharge(page, rate)` | Clicks the chevron inside "Descuento General", selects "Aplicar Recargo", fills and confirms. Rate defaults to `SEED.surcharge.rate`. |
| `assertSalePanelUI(page, ui)` | Asserts `descuentos` (red span), `subtotal`, `impuestos`, and `total` (3xl span) against `ui` object values. Uses a regex builder that tolerates trailing zeros (`$3.75` matches `$3.750`). |
| `finalizeSaleAndAssert(page, { precision, multiProduct })` | Clicks "Terminar Venta", waits for payments URL, starts `captureSaleMutation`, calls `completePayment`, then reads the captured request body and calls `assertDetailPrecision` or `assertAllProductsDetailPrecision` + `assertSummaryPrecision`. |
| `assertDetailPrecision(body, expected)` | Asserts every key in `expected` against `body.details[0]`. |
| `assertAllProductsDetailPrecision(body, expectedDetails)` | For multi-product surcharge tests: finds each expected detail by `price` in `body.details` and asserts all its fields. |
| `assertSummaryPrecision(body, expected)` | Asserts every key in `expected` against `body.summary`. |

**Holiday IVA handling:** If the text "IVA DIFERENCIADO APLICADO" is visible on the POS page, the spec switches from `precision` to `precisionHoliday`. Both sets of expected values are kept in `SEED`. If `precisionHoliday` is `undefined`, the regular precision is always used.

---

## Shared infrastructure — `POS-R/harness/`

These helpers are exclusive to restaurant specs. They depend on the Chef app being reachable at `PLAYWRIGHT_CHEF_URL`.

### `pos-orders-common.js`

The central hub for all POS-R specs. Imports from both `chef-orders-flow.js` and the parent `harness/pos-sale-flow.js`.

| Export | Purpose |
|---|---|
| `navigateToRestaurantPOS(page, tenantBaseUrl)` | Calls `ensureAuthenticated` to `/pos/restaurant-home` with `authType: "restaurant"`. Handles the edge case where the POS shows a login button instead of "Cliente:" (re-runs `loginAndSelectSubsidiary`). |
| `createChefOrder(page, { tableName, productName, quantity })` | Authenticates in Chef (`ensureChefAuthenticated`), selects a table, searches and adds a product, sets quantity, submits the order. Defaults: `tableName="mesa 1"`, `productName="caja de alitas"`, `quantity=1`. Waits for `PATCH/POST /api/v1/restaurant/orders → 200/201`. |
| `finalizeSaleWithPayment(page)` | Assigns `consumidorFinal` cedula, clicks "Terminar Venta", waits for `/pos/restaurant-payments`, calls `completePayment`. |
| `addProductToExistingOrder(page, productName)` | Clicks "Agregar Productos", types the product name (with `pressSequentially`), clicks the result, clicks "Guardar Cambios", confirms the dialog. Waits for `PATCH /api/v1/restaurant/orders/{id} → 200`. Asserts snackbar "Orden actualizada con éxito". |
| `collectOrder(page)` | Clicks "Cobrar Orden". |
| `openAndSelectOrder(page, tableName)` | Clicks "Cobrar pedidos", finds `.order-card` matching `tableName` (default `"mesa 1"`), clicks it. |
| `navigateToCloseOrderFromOptions(page)` | Opens "Más Opciones" drawer, clicks "Cerrar Ordenes", waits for `/pos/close-restaurant-order`. |
| `navigateToChangeOrderStatusFromOptions(page)` | Opens "Más Opciones" drawer, scrolls until "Cambiar Estado de Ordenes" is visible (up to 5 wheel steps of 600px), clicks it, waits for `/pos/change-order-status`. |
| `closeAllActiveOrders(page, tenantBaseUrl)` | **Pre-test cleanup loop.** Navigates to Close Orders in a loop: if an order card is found, clicks it, calls `processOrderClosure` with "Limpieza automática pre-prueba (Basura residual)". Repeats until "No hay órdenes disponibles" appears. Used in `test.beforeAll` by most POS-R specs. |

### `chef-orders-flow.js`

Low-level helpers for interacting with the Chef app UI. Used exclusively inside `createChefOrder` (from `pos-orders-common.js`) and `change-order-status-flow.spec.js`.

| Export | Purpose |
|---|---|
| `selectTable(page, tableName)` | Clicks the table button matching `tableName`. |
| `searchAndSelectProduct(page, productName)` | Clicks "Productos" tab, fills the search bar, clicks the matching product button. |
| `addProductToCart(page, quantity)` | Clicks "Agregar". If `quantity > 1`, increments using `.relative.inline-block > .md` before adding. Waits for button to be hidden (confirms it was added). |
| `submitOrder(page)` | Clicks "Carrito" tab, clicks "Agregar a la orden" or "Terminar orden", waits for `PATCH/POST /api/v1/restaurant/orders → 200/201`, asserts success message, clicks "Continuar", asserts "Detalle de consumo" visible. |
| `printPreticket(page)` | Clicks the printer icon, clicks "Aceptar", waits for `PATCH /api/v1/restaurant/orders/{id}/update-status → 200`. Used in `change-order-status-flow.spec.js` to move the order to a printed state before testing the status-change flow. |

### `pos-close-order.js`

| Export | Purpose |
|---|---|
| `navigateToCloseOrder(page)` | Clicks "Cerrar Orden / Finalizar orden" button, waits for `/pos/close-restaurant-order/{id}`. |
| `processOrderClosure(page, observation)` | Fills the observation input, clicks "Cerrar Orden" (exact), clicks "Confirmar Cierre", waits for `POST /api/v1/pos/orders/{id}/close → 200`, asserts "Orden cerrada con éxito". |

### `pos-change-order-status.js`

| Export | Purpose |
|---|---|
| `selectOrderToChangeStatus(page)` | Clicks the first `.tw-cursor-pointer.tw-group` card on `/pos/change-order-status`. |
| `processOrderStatusChange(page)` | Clicks "Cambiar a Pendiente", clicks "Confirmar Cambio", waits for `PATCH /api/v1/pos/orders/{id}/update-status → 200`, asserts snackbar "Estado de la orden actualizado con éxito". |

### `pos-delivery-flow.js`

Exports `DELIVERY_SEED` constant plus step-functions for the delivery address flow:

```
DELIVERY_SEED = {
  phone: "0999999922",
  clientName: "Cliente Delivery Test",
  observation: "Observación de prueba automatizada",
  address: { name: "Casa Test", address: "Av. Principal 123", observation: "Timbre azul, segundo piso" }
}
```

| Export | Purpose |
|---|---|
| `openDeliveryModal(page)` | Clicks "Delivery" button, asserts "Método de Entrega" modal, returns it. |
| `selectDeliveryMode(page, modal)` | Clicks the "Delivery / Envío a domicilio" option inside the modal. |
| `ensureDeliveryPhoneAndAddress(page, modal, phone)` | Sets the phone field, waits for `.delivery-address-strip`, checks for an existing address card. Returns `{ form, isNew: true }` if none exist (and opens the new-address form), or `{ form: null, isNew: false }` if one exists. |
| `fillDeliveryFormInfo(page, form, { clientName, observation })` | Fills "Nombre del cliente" and optionally "Observaciones generales" in the delivery form overlay. |
| `addClientFromDeliveryForm(page, form, { cedula })` | Opens the client modal from within the delivery form, selects "CEDULA" identity type, fills the cedula, clicks search, saves. Waits for `GET /api/v1/pos/people → 200`. Asserts snackbar "Cliente creado correctamente". |
| `fillDeliveryAddress(page, form, { name, address, observation })` | Fills "Nombre de la Dirección", "Calle, número, piso", and optionally "Indicaciones adicionales". |
| `saveDeliveryForm(page)` | Clicks "Guardar" in the delivery info overlay, waits for `POST /api/v1/restaurant/deliveries → 201`, asserts snackbar "Creación exitosa", closes the form. |
| `selectExistingDeliveryAddress(page)` | Clicks the first non-"Nueva dirección" button in `.delivery-address-strip`. |
| `saveDeliverySelection(page)` | Clicks the "Guardar" button that contains `.mdi-content-save` icon. |
| `verifyDeliveryConfirmed(page)` | Asserts `.panelContainer` with text "Delivery a domicilio" is visible. |

### `pos-remove-products.js`

| Export | Purpose |
|---|---|
| `navigateToRemoveProducts(page)` | Clicks "Quitar Productos", waits for `/pos/separate-order/{id}/remove`. |
| `selectProductToRemove(page, productName)` | Clicks the matching `.tw-cursor-pointer` card. |
| `confirmProductRemoval(page)` | Clicks "Quitar Productos" (exact), waits for `GET /api/v1/pos/categories → 200`. |

### `pos-separate-order.js`

| Export | Purpose |
|---|---|
| `navigateToSeparateOrder(page)` | Clicks "Cobro Parcial", waits for `/pos/separate-order/{id}/partial`. |
| `selectProductToSeparate(page, productName)` | Clicks the matching `.tw-cursor-pointer` card. |
| `confirmOrderSeparation(page)` | Clicks "Separar Orden" (exact), waits for redirect to `/pos/restaurant-home`. |

---

## POS-R pattern — serial + beforeAll cleanup

All POS-R specs except `delivery-flow.spec.js` follow this mandatory pattern:

```javascript
test.describe.configure({ mode: "serial" });

test.describe("POS Restaurant — [Name] @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);
  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    await closeAllActiveOrders(cleanupPage, getTenantBaseUrl());
    await context.close();
  });

  test("creates a new order from Chef", async ({ page }) => { ... });
  test("does something with the order", async ({ page }) => { ... });
});
```

**Why `beforeAll` cleanup matters:** POS-R tests create real orders in the restaurant system. Leftover orders from previous test runs (or partial failures) will break subsequent tests because `openAndSelectOrder` always picks `"mesa 1"` and the spec expects a clean state. `closeAllActiveOrders` loops until no orders remain before the suite starts.

**Why serial:** The first test creates the order (Chef → POS system). The second test consumes it. If they ran in parallel, the second test would find no order. The `test.describe.configure({ mode: "serial" })` call must appear before `test.describe`.

**`delivery-flow.spec.js` is the exception:** It does not use `serial` or `beforeAll` because it handles any pre-existing state internally via `ensureDeliveryPhoneAndAddress` (which detects whether a delivery address already exists and branches accordingly).

---

## Specs — POS common

These specs run under both `POS-Retail` (fixture: `posPage`, authType: `retail`) and `POS-Restaurant` (fixture: `posRestaurantPage`, authType: `restaurant`) unless noted otherwise.

---

### 1. `cash-movements.spec.js`

**What it tests:** Cash income and expense transactions recorded from the "Más Opciones" drawer in a single test.

**authTypes:** `retail` + `restaurant` (two `test.describe` groups via loop)

**Test structure:** One test per environment, not serial.

**`setTimeout`:** 180 000 ms

**Flow:**

```
openDrawer("Más Opciones" button, /Opciones/i)
  └─ clickCashMovementOption (drawer)       → opens "Registro de Ingresos/Egresos" dialog

Step 1 — income:
  fillAndSubmitCashForm(page, "in")
    └─ click "Ingreso" span
    └─ fill Monto: SEED.cashMovement.monto ("1")
    └─ fill Descripción: SEED.cashMovement.descripcion ("test automatizado")
    └─ click "Guardar Ingreso"
    └─ wait: POST /api/v1/pos/cash-movements → 201
    └─ assert snackbar "Movimiento registrado exitosamente"
    └─ assert dialog gone

Step 2 — expense:
  closeDrawer(/Opciones/i)
  openDrawer again
  clickCashMovementOption
  fillAndSubmitCashForm(page, "out")
    └─ click "Egreso" span (same form, different type)
    └─ same fields and assertion
```

**Endpoint exercised:** `POST /api/v1/pos/cash-movements → 201`

---

### 2. `sale-cart.spec.js`

**What it tests:** Cart manipulation (remove by trash icon, clear sale, clear quotation) and the $50 client-assignment rule. Retail-only: document-type selection on sale completion.

**authTypes:** `retail` + `restaurant`

**Test structure:** 3 tests for both environments; a 4th test (`completes a sale using a dynamic document type`) only runs for Retail.

**`setTimeout`:** 60 000 ms (cart tests), 120 000 ms (sale completion test)

**Tests:**

| Test | Environments | What it verifies |
|---|---|---|
| "handles product removal and cart clearing in sale mode" | Both | Add product → remove via trash icon → assert "No hay productos seleccionados". Then add again → click "Limpiar Venta" → assert empty. |
| "handles product removal and cart clearing in quote mode" | Both | Add product → click "Cotizar" → remove via trash → assert empty. Then add again → ensure quote mode → "Limpiar Cotización" → assert empty. |
| "assigns a real client when sale total exceeds $50" | Both | Sets quantity `SEED.sale.restrictedAmount` ("14"), reads the total. If ≥ $50, assigns `SEED.clients.test.cedula`. Clicks "Terminar Venta"; if blocked by the $50 snackbar, assigns the client and retries. Asserts redirect to payments URL. |
| "completes a sale using a dynamic document type" | Retail only | Calls `runPosSaleFlow` with `getDynamicDocumentType("retail")` and `skipNavigation: true`. |

**Key detail — $50 rule:** The test reads the actual total from `.tw-text-3xl` because the restriction is server-enforced. The client assignment step is conditional on the total being ≥ 50. The snackbar re-check handles the case where the total was borderline and the server still rejected it.

---

### 3. `sale-financial-precision.spec.js`

**What it tests:** That discount and surcharge calculations are applied with the exact long-decimal precision expected by the backend, both in the UI panel and in the sale mutation request body.

**authTypes:** `retail` + `restaurant`

**Test structure:** Generated via loop — 4 `test.describe` groups total (2 environments × 2 modifier types). Not serial.

**`setTimeout`:** 120 000 ms (discount tests), 180 000 ms (surcharge test)

**Groups generated:**

| Group | Modifier | Tests generated | Products |
|---|---|---|---|
| POS Retail — Discount | `applyGeneralDiscount` | 2 (one per `PRECISION_CASES` entry) | `estandar`, `combo` |
| POS Restaurant — Discount | `applyGeneralDiscount` | 2 | `estandar`, `combo` |
| POS Retail — Surcharge | `applyManualSurcharge` | 1 (all products in one sale) | `tallaColor`, `serie`, `servicio`, `elaborado`, `combo`, `estandar`, `preElaborado`, `subproducto` |
| POS Restaurant — Surcharge | `applyManualSurcharge` | 1 (all products in one sale) | `servicio`, `elaborado`, `combo`, `estandar`, `preElaborado`, `subproducto` |

**Discount flow (per `PRECISION_CASES` entry):**

```
runFinancialPrecisionFlow:
  └─ assert "Cliente:" + "No hay productos seleccionados" visible
  └─ if requiresClient → selectClientByCedula
  └─ searchAndSelectProduct (+ afterProductSelect if needed)
  └─ applyGeneralDiscount (rate: SEED.discount.rate = "3.3337373372323")
  └─ holiday detection → select precision set
  └─ assertSalePanelUI (descuentos, subtotal, impuestos, total)
  └─ finalizeSaleAndAssert
       └─ click "Terminar Venta" → wait payments URL
       └─ captureSaleMutation (intercept POST /api/v2/pos/sales)
       └─ completePayment
       └─ assertDetailPrecision(body.details[0], SEED.discount.precision[key].detail)
       └─ assertSummaryPrecision(body.summary, SEED.discount.precision[key].summary)
```

**Surcharge flow (single test, all products):**

```
runAllProductsSurchargeFlow:
  └─ selectClientByCedula(consumidorFinal)
  └─ for each product: searchAndSelectProduct + afterSelect
  └─ applyManualSurcharge (rate: SEED.surcharge.rate = "3.3337373372323")
  └─ holiday detection
  └─ assertSalePanelUI
  └─ finalizeSaleAndAssert(multiProduct: true)
       └─ assertAllProductsDetailPrecision (matches each detail by price field)
       └─ assertSummaryPrecision
```

**Combo product** always requires `SEED.clients.consumidorFinal.cedula` ("0000000001") because combo prices may trigger the >$50 rule.

**Preconditions:** All products in `SEED.products` must exist in the tenant with the exact prices that produce the values in `SEED.discount.precision` and `SEED.surcharge.precision`. Holiday IVA detection is automatic — if the IVA banner is present the spec silently switches to the holiday precision set.

---

### 4. `sale-options.spec.js`

**What it tests:** The Sale Options side panel — adding a sale note and saving/recovering a draft sale.

**authTypes:** `retail` + `restaurant`

**Test structure:** 2 tests per environment, not serial.

**`setTimeout`:** 120 000 ms (note test), 240 000 ms (save/recover test)

**Test 1 — "validates adding a note and completing a sale from the Sale Options panel":**

```
searchAndSelectProduct(estandar)
openDrawer(last .v-btn--icon.tw-flex-shrink-0 button, /Opciones de venta/i)
  └─ clickObservationDialog → fills SEED.sale.observationText → saves → dialog closed
closeDrawer
click "Terminar Venta" → waitURL(paymentUrl)
completePayment({ printTicket: true })
assert snackbar "Comprobante Impreso"
```

**Test 2 — "saves a sale with an alias and then recovers it from the Saved Sales screen":**

```
searchAndSelectProduct(estandar)
openDrawer(Sale Options)
  └─ openSaveSaleDialog
  └─ fillAliasAndSave(SEED.sale.savedSaleAlias)
       └─ POST /api/v1/pos/draft-sales → 201
       └─ snackbar "Tu venta ha sido guardada"

openDrawer("Más Opciones", /Opciones/i)
  └─ navigateToSavedSales → /pos/saved-sales

expandAndRecoverFirstSavedSale
  └─ click "Recuperar" → waitURL /pos/(restaurant-)?home

click "Terminar Venta" → waitURL(paymentUrl)
completePayment({ printTicket: true })
assert snackbar "Comprobante Impreso"
```

**Endpoints exercised:**
- `POST /api/v1/pos/draft-sales → 201` (save draft)
- `POST /api/v2/pos/sales → 200` (sale completion via `completePayment`)

---

### 5. `sale-product-options.spec.js`

**What it tests:** The per-product "Opciones del Producto" modal — all combinations of price type (A, C) and discount type (Porcentaje, Fijo).

**authTypes:** `retail` + `restaurant`

**Test structure:** One test per environment, not serial.

**`setTimeout`:** 120 000 ms

**Flow:**

```
searchAndSelectProduct(estandar)

Step 1: applyProductOptions({ priceLabel: "Precio A", discountType: "Porcentaje" })
  └─ openProductOptions → dialog "Opciones del Producto"
  └─ setQuantityInOptions(SEED.sale.productOptionsQuantity = "3.3337373372323")
  └─ selectPriceType("Precio A") → assert selected-price-option class
  └─ setUnitPriceInOptions(SEED.sale.productOptionsUnitPrice = "3.3337373372323")
  └─ setDiscountInOptions(SEED.discount.rate, "Porcentaje")
  └─ saveProductOptions → dialog gone
assert ".v-card:has-text('Precio Total')" visible

Step 2: applyProductOptions({ priceLabel: "Precio C", discountType: "Porcentaje" })
Step 3: applyProductOptions({ priceLabel: "Precio A", discountType: "Fijo" })

Step 4: applyProductOptions({ priceLabel: "Precio C", discountType: "Fijo" })
  └─ click "Terminar Venta" → waitURL(paymentUrl)
  └─ completePayment()
```

**Endpoint exercised:** `POST /api/v2/pos/sales → 200`

---

### 6. `sale-quotations.spec.js`

**What it tests:** The full quotation workflow — creating quotations with and without PDF, and recovering a pending quotation to complete the sale.

**authTypes:** `retail` + `restaurant`

**Test structure:** `test.describe.serial` — 2 tests per environment (first creates quotations, second recovers one).

**`setTimeout`:** 180 000 ms (both tests)

**Test 1 — "creates quotations with and without PDF generation":**

Runs `runQuoteFlow` twice (with PDF, then without):

```
runQuoteFlow({ homePath, observacion, paymentTerms, pdfChoice }):
  └─ page.goto(homePath) → waitURL
  └─ selectClientByCedula(consumidorFinal)
  └─ searchAndSelectProduct(estandar)
  └─ click "Cotizar"
  └─ click "Guardar Cotización"
  └─ fill modal: observación = SEED.sale.quoteObservation
                 términos     = SEED.sale.quotePaymentTerms
                 PDF radio    = pdfChoice (null = default/show PDF, "No mostrar PDF")
  └─ POST /api/v1/billing/quotes → 201
  └─ snackbar "Cotización Guardada"
  └─ if pdfChoice ≠ "No mostrar PDF": assert .pdf-page visible
```

**Test 2 — "retrieves a pending quotation and completes the sale":**

```
openDrawer("Más Opciones", /Opciones/i)
  └─ navigateToConsumeQuotes → /pos/consume-quotes
selectFirstQuoteAndBill
  └─ click first quote card
  └─ click "Facturar"
  └─ POST /api/v1/billing/quotes/{id} → 200
  └─ waitURL /pos/(restaurant-)?home
  └─ snackbar "Se ha convertido la cotización"
click "Terminar Venta" → waitURL(paymentUrl)
completePayment()
```

**Endpoints exercised:**
- `POST /api/v1/billing/quotes → 201` (create quotation)
- `POST /api/v1/billing/quotes/{id} → 200` (convert quotation to sale)
- `POST /api/v2/pos/sales → 200` (complete payment)

**Precondition for test 2:** At least one pending quotation must exist from test 1 (serial dependency). The test picks the first available card — it does not filter by quotation identity.

---

### 7. `sale-with-client.spec.js`

**What it tests:** All three customer assignment methods available in the POS — the Personas modal, direct cedula input, and the identity-type lookup dialog.

**authTypes:** `retail` + `restaurant`

**Test structure:** One test per environment, not serial.

**`setTimeout`:** 180 000 ms

**Flow — single test that exercises all three methods in sequence:**

```
Method 1 — Personas modal:
  └─ click .v-btn--icon.bg-primary.v-btn--density-default (first)
  └─ Personas modal appears
  └─ fill search with SEED.clients.test.cedula ("0000000001")
  └─ click matching row
  └─ assert modal gone + SEED.clients.test.name visible

Method 2 — Direct cedula input:
  └─ fill "Ingresa Cédula o RUC" with consumidorFinal.cedula
  └─ press Enter
  └─ client confirmation modal → "Guardar Cliente"
  └─ snackbar "Cliente asignado correctamente"
  └─ assert consumidorFinal.cedula visible

Method 3 — Identity-type lookup dialog:
  └─ clear input → click search icon button on the cedula field
  └─ client modal with #identity-input appears
  └─ click .v-select for identity type → select "CEDULA"
  └─ fill #identity-input with consumidorFinal.cedula
  └─ click magnify button
  └─ "Guardar Cliente" → snackbar
  └─ assert consumidorFinal.cedula visible

Complete sale:
  └─ runPosSaleFlow(estandar, skipNavigation: true, printTicket: true)
  └─ assert snackbar "Comprobante Impreso"
```

**Endpoints exercised:** `POST /api/v2/pos/sales → 200`

---

## Specs — POS-C (Retail only)

### 8. `sale-inventory-dispatch.spec.js`

**Location:** `POS-C/`
**Playwright project:** `POS-Retail`

**What it tests:** That the POS handles sales of inventory-sensitive product types (Estandar, Serie, TallaColor) correctly both when post-sale inventory dispatch is enabled and when it is not.

**authTypes:** `dispatch` (dispatch enabled) + `retail` (dispatch disabled) — two `test.describe` groups in the same file.

**Test structure:** One test per group, not serial.

**`setTimeout`:** 180 000 ms

**Products used per test:**

| Product | Dispatch enabled `afterProductSelect` | Dispatch disabled `afterProductSelect` |
|---|---|---|
| `estandar` | `null` | `null` |
| `serie` | `null` (dispatch skips the series-selection modal) | `selectFirstSerie` |
| `tallaColor` | `selectFirstVariant` | `selectFirstVariant` |

**Key detail — dispatch and series modal:** When dispatch is enabled, the serie product does not trigger the serial number selection modal. The `buildProbeProducts` function conditionally assigns `afterProductSelect: dispatchEnabled ? null : selectFirstSerie` for the serie product.

**Flow (per test):**

```
for each product in buildProbeProducts({ dispatchEnabled }):
  test.step(`Sale [${type}] — ${name}`)
    └─ runPosSaleFlow({ productName, searchTerm, afterProductSelect })
         └─ searchAndSelectProduct
         └─ optional: selectFirstVariant / selectFirstSerie
         └─ click "Terminar Venta"
         └─ waitURL /pos/(restaurant-)?payments
         └─ completePayment()
```

**Endpoint exercised:** `POST /api/v2/pos/sales → 200` (3 times per test)

---

## Specs — POS-R (Restaurant only)

All POS-R specs require `requireChefCredentials(test)` in addition to `requirePosCredentials(test)`. All use `authType: "restaurant"` and `restaurant-session.json`. All follow the serial + `beforeAll` cleanup pattern described above, except `delivery-flow.spec.js`.

---

### 9. `close-orders-flow.spec.js`

**What it tests:** Full order closure from within an open order (via the "Cerrar Orden / Finalizar orden" button in the order detail view).

**Test structure:** `test.describe.serial`, 2 tests.

| Test | `setTimeout` | Action |
|---|---|---|
| "creates a new order from Chef for closure" | 120 000 ms | `createChefOrder()` |
| "closes an existing order from the POS" | 180 000 ms | `navigateToRestaurantPOS` → `openAndSelectOrder` → `navigateToCloseOrder` → `processOrderClosure("test")` |

**`processOrderClosure` flow:**

```
fill observation input → click "Cerrar Orden" (exact)
→ click "Confirmar Cierre"
→ wait: POST /api/v1/pos/orders/{id}/close → 200
→ assert "Orden cerrada con éxito"
```

---

### 10. `close-orders-from-options.spec.js`

**What it tests:** Order closure accessed via "Más Opciones" → "Cerrar Ordenes" (the options-menu path, as opposed to the in-order path in spec 9).

**Test structure:** Single test (not serial). Self-healing: if no orders exist on the close-orders screen, creates one from Chef inline.

**`setTimeout`:** 180 000 ms

**Flow:**

```
navigateToRestaurantPOS
navigateToCloseOrderFromOptions → /pos/close-restaurant-order

assert (emptyMessage or orderCard) visible
if emptyMessage visible:
  createChefOrder()
  navigateToRestaurantPOS
  navigateToCloseOrderFromOptions

click first order card
processOrderClosure("test")
```

**Why no `serial` here:** The test handles missing orders itself. No separate "create" test is needed.

---

### 11. `collect-orders-flow.spec.js`

**What it tests:** The "Cobrar / Procesar pago" path — loading an order from the orders modal into the POS sale screen and completing the payment.

**Test structure:** `test.describe.serial`, 2 tests.

| Test | `setTimeout` | Action |
|---|---|---|
| "creates a new order from Chef" | 120 000 ms | `createChefOrder()` |
| "collects an existing order, assigns a client and completes the sale" | 180 000 ms | `navigateToRestaurantPOS` → `openAndSelectOrder` → click "Cobrar / Procesar pago" button → `finalizeSaleWithPayment` |

**`finalizeSaleWithPayment` flow:**

```
selectClientByCedula(consumidorFinal)
click "Terminar Venta" → waitURL /pos/restaurant-payments
completePayment()
```

**Endpoint exercised:** `POST /api/v2/pos/sales → 200`

---

### 12. `update-order-flow.spec.js`

**What it tests:** Adding a product to an already-existing order from within the POS order detail, then collecting and completing the payment.

**Test structure:** `test.describe.serial`, 2 tests.

| Test | `setTimeout` | Action |
|---|---|---|
| "creates a new order from Chef" | 120 000 ms | `createChefOrder()` |
| "adds a product to an existing order and completes the sale" | 180 000 ms | `navigateToRestaurantPOS` → `openAndSelectOrder` → `addProductToExistingOrder("Caja de alitas de pollo (100 u)")` → `collectOrder` → waitURL payments → `completePayment` |

**`addProductToExistingOrder` flow:**

```
click "Agregar Productos"
fill search input with productName (pressSequentially, 50ms delay)
wait: GET /api/v1/inventory/products → 200
click matching list item
click "Guardar Cambios"
dialog "Confirmar Actualización" appears → click "Confirmar"
wait: PATCH /api/v1/restaurant/orders/{id} → 200
assert snackbar "Orden actualizada con éxito"
```

---

### 13. `remove-products-flow.spec.js`

**What it tests:** Removing one unit of a product from a multi-unit order (partial removal), then completing the reduced-quantity sale.

**Test structure:** `test.describe.serial`, 2 tests.

| Test | `setTimeout` | Action |
|---|---|---|
| "creates an order from Chef with 2 units" | 120 000 ms | `createChefOrder({ quantity: 2 })` |
| "removes a product from an existing order and completes the sale" | 180 000 ms | `navigateToRestaurantPOS` → `openAndSelectOrder` → `navigateToRemoveProducts` → `selectProductToRemove("caja de alitas")` → `confirmProductRemoval` → assert "Cliente:" visible → `finalizeSaleWithPayment` |

**`confirmProductRemoval` flow:**

```
click "Quitar Productos" (exact)
wait: GET /api/v1/pos/categories → 200
(page returns to POS home with reduced cart)
```

**Note:** The order is created with 2 units so that removing 1 leaves a valid non-zero cart. The remaining unit is then sold normally.

---

### 14. `separate-order-flow.spec.js`

**What it tests:** Splitting one product out of a multi-unit order into a separate partial charge ("Cobro Parcial"), then completing the split sale.

**Test structure:** `test.describe.serial`, 2 tests.

| Test | `setTimeout` | Action |
|---|---|---|
| "creates an order from Chef with 2 units" | 120 000 ms | `createChefOrder({ quantity: 2 })` |
| "separates a product from an existing order and completes the sale" | 180 000 ms | `navigateToRestaurantPOS` → `openAndSelectOrder` → `navigateToSeparateOrder` → `selectProductToSeparate("caja de alitas")` → `confirmOrderSeparation` → assert "Cliente:" → `finalizeSaleWithPayment` |

**`confirmOrderSeparation` flow:**

```
click "Separar Orden" (exact)
waitURL /pos/restaurant-home
(the separated product is now a new independent order; the original order retains the remaining units)
```

---

### 15. `change-order-status-flow.spec.js`

**What it tests:** Moving a printed order (preticket printed in Chef) back to pending status from the POS "Cambiar Estado de Ordenes" screen.

**Test structure:** Single test (not serial), with a `beforeAll` that clears orders.

**`setTimeout`:** 180 000 ms

**Flow:**

```
test.beforeAll: closeAllActiveOrders

test: "creates an order in Chef, prints preticket, and changes status back to pending in POS"

Step 1 — Create order and print preticket from Chef:
  └─ createChefOrder({ tableName: "mesa 1" })
  └─ printPreticket(page)
       └─ click printer icon
       └─ click "Aceptar"
       └─ wait: PATCH /api/v1/restaurant/orders/{id}/update-status → 200

Step 2 — Navigate to restaurant POS:
  └─ navigateToRestaurantPOS

Step 3 — Open More Options → Change Order Status:
  └─ navigateToChangeOrderStatusFromOptions → /pos/change-order-status

Step 4 — Select order:
  └─ selectOrderToChangeStatus → clicks first .tw-cursor-pointer.tw-group card

Step 5 — Process status change:
  └─ processOrderStatusChange
       └─ click "Cambiar a Pendiente"
       └─ click "Confirmar Cambio"
       └─ wait: PATCH /api/v1/pos/orders/{id}/update-status → 200
       └─ assert snackbar "Estado de la orden actualizado con éxito"
```

**Why preticket is needed:** The "Cambiar Estado de Ordenes" screen only shows orders that have been printed (status = printed/ready). Without calling `printPreticket`, the order would remain in pending state and would not appear on the status-change screen.

---

### 16. `delivery-flow.spec.js`

**What it tests:** Setting a delivery address for a restaurant order — either creating a new address or selecting an existing one, depending on whether one already exists for the test phone number.

**Test structure:** Single test, no serial, no `beforeAll`. The test is self-healing via `ensureDeliveryPhoneAndAddress`.

**`setTimeout`:** 180 000 ms

**Annotations:**
- `issue`: `WS-871`
- `known_issue`: Timeout failures may occur due to phone/client search lag after prolonged system use.

**Flow:**

```
navigateToRestaurantPOS

openDeliveryModal → "Método de Entrega" modal

selectDeliveryMode → click "Delivery / Envío a domicilio"

ensureDeliveryPhoneAndAddress(modal, DELIVERY_SEED.phone = "0999999922")
  └─ sets phone field if not already set
  └─ waits for .delivery-address-strip (15 000 ms)
  └─ checks for existing address card

if isNew (no existing address):
  fillDeliveryFormInfo({ clientName: "Cliente Delivery Test", observation })
  addClientFromDeliveryForm({ cedula: consumidorFinal.cedula })
    └─ GET /api/v1/pos/people → 200
    └─ snackbar "Cliente creado correctamente"
  fillDeliveryAddress({ name: "Casa Test", address: "Av. Principal 123", observation: "Timbre azul, segundo piso" })
  saveDeliveryForm
    └─ POST /api/v1/restaurant/deliveries → 201
    └─ snackbar "Creación exitosa"
    └─ close form overlay
  selectExistingDeliveryAddress (the one just created)
  saveDeliverySelection

else (address already exists):
  selectExistingDeliveryAddress
  saveDeliverySelection

verifyDeliveryConfirmed → .panelContainer has "Delivery a domicilio"
```

**Endpoints exercised (new-address branch only):**
- `GET /api/v1/pos/people → 200` (client lookup)
- `POST /api/v1/restaurant/deliveries → 201` (create delivery address)

**Precondition:** None strictly required. The test adapts to both states. If the address exists from a prior run, it is selected directly without recreating it.

---

## Seed data used by POS specs

All constants come from `e2e/Wanqara/harness/seed.js` unless noted.

| Constant | Value | Used by |
|---|---|---|
| `SEED.products.estandar` | `"Caja de alitas de pollo (100 u)"`, code `Caj000000001` | All common specs, POS-C |
| `SEED.products.serie` | `"series test"`, code `ser000000001` | `sale-inventory-dispatch`, `sale-financial-precision` |
| `SEED.products.tallaColor` | `"test talla color"`, code `tes000000002` | `sale-inventory-dispatch`, `sale-financial-precision` |
| `SEED.products.combo` | `"Combo alitas"`, code `Com000000019` | `sale-financial-precision` |
| `SEED.products.subproducto` | `"Alita Individual"` | `sale-financial-precision` |
| `SEED.products.preElaborado` | `"Bowl de Alitas Marinadas (20 u)"` | `sale-financial-precision` |
| `SEED.products.elaborado` | `"Porción de Alitas Marinadas"` | `sale-financial-precision` |
| `SEED.products.servicio` | `"servicio alita"` | `sale-financial-precision` |
| `SEED.clients.test` | `{ name: "Usuario Test", cedula: "0000000001" }` | `sale-cart`, `sale-with-client` |
| `SEED.clients.consumidorFinal` | `{ cedula: "0000000001" }` | `sale-cart`, `sale-quotations`, `sale-financial-precision`, POS-R |
| `SEED.cashMovement` | `{ monto: "1", descripcion: "test automatizado" }` | `cash-movements` |
| `SEED.sale.restrictedAmount` | `"14"` | `sale-cart` ($50 rule test) |
| `SEED.sale.observationText` | `"Observación de prueba automatizada"` | `sale-options` |
| `SEED.sale.savedSaleAlias` | `"Venta de prueba automatizada"` | `sale-options` |
| `SEED.sale.quoteObservation` | `"Observación de prueba automatizada"` | `sale-quotations` |
| `SEED.sale.quotePaymentTerms` | `"Términos de pago de prueba automatizada"` | `sale-quotations` |
| `SEED.sale.productOptionsQuantity` | `"3.3337373372323"` | `sale-product-options` |
| `SEED.sale.productOptionsUnitPrice` | `"3.3337373372323"` | `sale-product-options` |
| `SEED.discount.rate` | `"3.3337373372323"` | `sale-financial-precision`, `sale-product-options` |
| `SEED.surcharge.rate` | `"3.3337373372323"` | `sale-financial-precision` |
| `SEED.discount.precision` | Per-product-type expected values for detail + summary | `sale-financial-precision` |
| `SEED.surcharge.precision` | Per-environment expected values for all-product surcharge | `sale-financial-precision` |
| `SEED.discount.precisionHoliday` | Holiday-IVA variant of `precision` | `sale-financial-precision` |
| `SEED.surcharge.precisionHoliday` | Holiday-IVA variant | `sale-financial-precision` |
| `DELIVERY_SEED` | `{ phone, clientName, observation, address }` | `delivery-flow` (in `pos-delivery-flow.js`) |

---

## Spec summary

| # | File | Sub-folder | Environments | Serial | Chef required | Tests |
|---|---|---|---|---|---|---|
| 1 | `cash-movements.spec.js` | `common` | Retail + Restaurant | No | No | 2 |
| 2 | `sale-cart.spec.js` | `common` | Retail + Restaurant | No | No | 7 (3+3+1 retail-only) |
| 3 | `sale-financial-precision.spec.js` | `common` | Retail + Restaurant | No | No | 6 (2+1 per env) |
| 4 | `sale-options.spec.js` | `common` | Retail + Restaurant | No | No | 4 |
| 5 | `sale-product-options.spec.js` | `common` | Retail + Restaurant | No | No | 2 |
| 6 | `sale-quotations.spec.js` | `common` | Retail + Restaurant | **Yes** | No | 4 |
| 7 | `sale-with-client.spec.js` | `common` | Retail + Restaurant | No | No | 2 |
| 8 | `sale-inventory-dispatch.spec.js` | `POS-C` | Retail + Dispatch | No | No | 2 |
| 9 | `close-orders-flow.spec.js` | `POS-R` | Restaurant | **Yes** | Yes | 2 |
| 10 | `close-orders-from-options.spec.js` | `POS-R` | Restaurant | No | Yes | 1 |
| 11 | `collect-orders-flow.spec.js` | `POS-R` | Restaurant | **Yes** | Yes | 2 |
| 12 | `update-order-flow.spec.js` | `POS-R` | Restaurant | **Yes** | Yes | 2 |
| 13 | `remove-products-flow.spec.js` | `POS-R` | Restaurant | **Yes** | Yes | 2 |
| 14 | `separate-order-flow.spec.js` | `POS-R` | Restaurant | **Yes** | Yes | 2 |
| 15 | `change-order-status-flow.spec.js` | `POS-R` | Restaurant | No | Yes | 1 |
| 16 | `delivery-flow.spec.js` | `POS-R` | Restaurant | No | No | 1 |