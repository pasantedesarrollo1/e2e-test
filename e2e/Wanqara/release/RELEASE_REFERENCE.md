# Release Suite — Reference

**Location:** `e2e/Wanqara/release/`
**Playwright project:** `Release`
**Test match pattern:** `/Wanqara/release/.*\.spec\.js/`
**storageState:** `retail-session.json` (default from config; individual specs override this — see per-spec table below)
**Tag:** `@release`
**Run command:** `npx playwright test --project=Release`

---

## What this suite is

Release specs validate **cross-cutting business rules that must pass before every deployment**. They are not repeatable regression checks — they exercise flows that depend on real tenant state (existing receivable accounts, real sales in history, real product recipes) and in some cases create and immediately destroy data to verify the system enforces the correct constraints.

If any spec in this suite fails, the release is blocked.

---

## Shared infrastructure

All release specs import helpers from **`e2e/Wanqara/release/herness/`** (note the folder name is `herness`, not `harness` — this is intentional).

| Helper file | Purpose |
|---|---|
| `cancel-sale-flow.js` | Navigates to `/admin/sales/list`, finds the most recent sale, opens the cancellation modal, asserts business-rule UI (inventory switch vs. no-inventory message), then closes without actually cancelling. |
| `multiple-receivables-flow.js` | Step-by-step helpers for the entire multiple-receivables payment flow: selecting a client, picking accounts from the modal, filling amounts, submitting, attempting deletion to trigger an expected error, navigating to settlement detail, generating a PDF voucher, and confirming final deletion. |
| `recipe-helpers.js` | Navigates to the product list, opens a product's detail view via tooltip, and asserts that recipe ingredient amounts are displayed rounded to 2 decimals in the UI but show the exact long decimal in the hover tooltip. |
| `subscriptions-flow.js` | Two exported functions: `validateSubscriptionsOverview` (asserts that all rendered plan, module, and receipt-pack data on the subscriptions page is present in `SEED_SUBSCRIPTIONS`) and `validateSubsidiaryCapabilityBadges` (navigates to the subsidiary creation form and asserts every blue capability badge matches a known module name or capability label from the seed). |
| `subscriptions-seed.js` | Exports `SEED_SUBSCRIPTIONS` — the authoritative catalogue of valid module codes/names, receipt-pack quantities, plan codes/names, and capability label strings. Used exclusively by `subscriptions-flow.js`. |

These helpers also rely on the global harness in `e2e/Wanqara/harness/`:

| Global helper | Used for |
|---|---|
| `harness/settings.js` → `requirePosCredentials`, `getTenantBaseUrl` | Skip guard + tenant URL resolution |
| `harness/auth.js` → `getSessionPath`, `ensureAuthenticated` | Per-spec storageState path + navigation with session recovery |
| `harness/seed.js` → `SEED`, `getDynamicDocumentType`, `getElectronicInvoicingAuthType` | All test data constants and dynamic auth/document type resolution |
| `harness/urls.js` → `withPath` | URL concatenation |
| `regression/transactions/sales/harness/admin-sale-flow.js` → `runAdminSaleFlow` | Full admin sale creation (used as setup step inside release specs) |
| `regression/transactions/sales/harness/admin-pre-sale-flow.js` → `runAdminPreSaleFlow` | Full admin pre-sale creation (same) |
| `regression/POS/harness/pos-sale-flow.js` → `runPosSaleFlow`, `selectClientByCedula` | Full POS sale creation (same) |
| `regression/transactions/other-documents/waybills/harness/waybill-flow.js` | All waybill form helpers (used by `waybill-long-product-name.spec.js`) |

---

## Specs

### 1. `cancel-sales.spec.js`

**What it tests:** The cancellation modal correctly shows or hides the *"Mover inventario"* switch depending on whether the sale has inventory movements. This is a business rule: subsidaries with dispatch suppress the switch; restaurant and retail without dispatch show it.

**How it works:** For each scenario, it first creates a sale (using `runAdminSaleFlow`, `runAdminPreSaleFlow`, or `runPosSaleFlow`), then calls `cancelFirstSaleAndVerify` which navigates to `/admin/sales/list`, finds the top row, opens the annulment modal, and asserts the modal's contents. **The sale is never actually cancelled** — the modal is closed.

**Test structure:** `test.describe.serial` — three groups, each serial. Groups run in parallel with each other.

| Test | authType | Sale type | `expectSwitch` | `expectMessage` |
|---|---|---|---|---|
| Restaurant (No Dispatch) | `restaurant` | Admin normal sale | `true` | `false` |
| Business (With Dispatch) | `dispatch` | Admin normal sale | `false` | `true` |
| Restaurant (No Dispatch) | `restaurant` | Admin pre-sale | `false` | `true` |
| Business (With Dispatch) | `dispatch` | Admin pre-sale | `false` | `true` |
| Retail (100) | `retail` | POS sale | `true` | `false` |
| Dispatch (101) | `dispatch` | POS sale | `false` | `true` |
| Restaurant (102) | `restaurant` | POS sale | `false` | `true` |

**Key detail:** Each test opens its own `browser.newContext` with the correct `storageState` — it does not use the project-level `storageState`. This is because multiple authTypes are needed within the same file.

**Endpoints exercised (during setup — sale creation):**
- `POST /api/v2/billing/sales` (admin sale)
- `POST /api/v2/billing/pre-sales` (admin pre-sale)
- `POST /api/v2/pos/sales` (POS sale)

**The cancellation modal itself does not hit an endpoint** — it is opened and closed without confirming.

---

### 2. `multiple-receivables.spec.js`

**What it tests:** The complete "pay multiple receivable accounts at once" flow, including a sub-flow where deleting a payment from the list view fails with an expected error, and deletion from the detail view succeeds.

**authType:** `getElectronicInvoicingAuthType()` — whichever subsidiary is configured for electronic invoicing (`Wanqara 001`). This resolves at runtime from `SEED.subsidiaries`.

**Route:** `/admin/payments/add/multiple-receivables`

**Test structure:** Single test, `test.describe` (not serial). `test.setTimeout(180_000)`.

**Flow in order:**

```
1. ensureAuthenticated → /admin/payments/add/multiple-receivables
2. selectClientAndAccounts
   └─ Click "Buscar cliente" → search by SEED.clients.test.cedula
   └─ Click "Agregar cuentas" → modal "Cuentas por cobrar"
   └─ "Seleccionar página" → "Confirmar selección"
3. fillPaymentDetailsAndSubmit
   └─ Fill each .multi-account-row input with "0.01"
   └─ Fill description
   └─ Select EFECTIVO from .multi-method-card
   └─ Click "Pagar"
   └─ Wait: POST /api/v1/accounting/payments/pay-multiple-receivable-accounts → 200
   └─ Assert snackbar "Abonos creados correctamente"
4. validateInitialDeletionError
   └─ Navigate to first row in list → "Ver esta cuenta"
   └─ Click delete on last payment row
   └─ Fill reason → "Eliminar Abono"
   └─ Assert error message "No es posible anular este|Anula desde el detalle"
5. navigateToSettlementDetails
   └─ Click "Ir al detalle" inside the error modal
6. generateAndViewPDF  (soft assertions — failure doesn't block the test)
   └─ Click "Generar PDF"
   └─ Wait: GET …/voucher-payment-account-detail → 200
   └─ Assert .pdf-viewer-card and .pdf-page visible
   └─ Close modal
7. confirmFinalDeletion
   └─ Click "Eliminar Abono" (last button on page)
   └─ Fill reason "test deletion reason"
   └─ Wait: DELETE /api/v1/accounting/account-payment-settlements/{id}/delete → 200
   └─ Assert snackbar "Abono eliminado exitosamente"
```

**Endpoints exercised:**
- `POST /api/v1/accounting/payments/pay-multiple-receivable-accounts`
- `GET …/voucher-payment-account-detail` (PDF generation)
- `DELETE /api/v1/accounting/account-payment-settlements/{id}/delete`

**Precondition:** `SEED.clients.test` (`cedula: "0000000001"`, name `"Usuario Test"`) must exist in the tenant and have at least one page of open receivable accounts.

---

### 3. `pos-print-ticket.spec.js`

**What it tests:** That when the *Imprimir Ticket* toggle is enabled at the payment screen, the system shows a "Comprobante Impreso" snackbar after the sale completes.

**authTypes:** `retail` and `dispatch` (two separate tests inside `test.describe.serial`).

**How it works:** Each test opens its own `browser.newContext`. Calls `ensureAuthenticated` to `/pos/home`, then `runPosSaleFlow` with `printTicket: true`. After `completePayment` resolves, asserts the snackbar.

**Key detail:** The `printTicket: true` flag is handled inside `completePayment` (`pos-payment.js`) — it checks the `.summary-action-btn` labeled "Imprimir Ticket" and toggles it to active if it isn't already before clicking "Finalizar Venta".

**Endpoint exercised:** `POST /api/v2/pos/sales` → 200

**Products used:** `SEED.products.estandar` ("Caja de alitas de pollo (100 u)")

---

### 4. `recipe-decimals-validation.spec.js`

**What it tests:** That recipe ingredient quantities are displayed with **2 decimal places** in the product detail UI, while the **exact long decimal** is preserved and visible in the hover tooltip. This prevents rounding bugs from silently corrupting recipe calculations.

**authType:** `retail`

**Test structure:** `test.describe.serial`, two tests (one for `elaborado`, one for `pre-elaborado`).

**How it works:** Each test calls `navigateToProductAndVerifyRecipeDecimals` which:
1. Goes to `/admin/products/list?inventory_init=false`
2. Searches for the product by name
3. Clicks "Ver este Producto" via tooltip detection on the actions cell
4. Finds the ingredient container by `ingredientName`
5. Asserts `.toContainText(roundedAmount)` and `.not.toContainText(exactAmount)` on the container
6. Hovers the ingredient name span to trigger the tooltip
7. Asserts the tooltip contains `exactAmount`

**Test data (from `SEED.recipeDecimals`):**

| Product | `productName` | `ingredientName` | `exactAmount` | `roundedAmount` |
|---|---|---|---|---|
| elaborado | `"Porción de Alitas Marinadas - ToolTip"` | `"Bowl de Alitas Marinadas (20 u)"` | `"0.74626865671642"` | `"0.75"` |
| pre-elaborado | `"Bowl de Alitas Marinadas (20 u) - ToolTip"` | `"Alita Individual"` | `"0.30000300003"` | `"0.3"` |

**No API endpoints are exercised** — this is a pure UI read/assertion test.

**Precondition:** These specific products must exist with these exact recipe configurations in the tenant.

---

### 5. `subscriptions-overview.spec.js`

**What it tests:** That the subscriptions page and the subsidiary creation form display only data that exists in the known catalogue (`SEED_SUBSCRIPTIONS`). This catches cases where new plans, modules, receipt packs, or capability badges are added to the backend without a corresponding entry in the seed — which would indicate either an undocumented feature or a misconfigured tenant.

**authType:** `retail`

**Routes touched:**
- `/admin/settings/subscriptions` (test 1)
- `/admin/home` → navigates internally to `/admin/subsidiaries/add` (test 2)

**Test structure:** `test.describe` (not serial), two independent tests.

| Test | `setTimeout` | Route entered via | Helper called |
|---|---|---|---|
| "Validates that displayed subscription cards match the seed data" | 120 000 ms | `ensureAuthenticated` to `/admin/settings/subscriptions` | `validateSubscriptionsOverview(page)` |
| "Validates that capability badges in subsidiary form match the seed data" | 60 000 ms | `ensureAuthenticated` to `/admin/home`, then internal `page.goto` inside the helper | `validateSubsidiaryCapabilityBadges(page, tenantBaseUrl)` |

**`validateSubscriptionsOverview` — what it checks:**

The function runs three `test.step` blocks in sequence. All comparisons are accent-insensitive (uses `str.normalize("NFD")` to strip diacritics before comparing).

1. **Page load** — waits for `span.tw-text-2xl` containing "Suscripciones" to be visible.
2. **Plan validation** — reads the text of `.tw-bg-primary .tw-text-base.tw-font-semibold.tw-text-white`. If the element is visible and the text is neither `"Sin plan"` nor a subsidiary code pattern (`/^\d{3}\s-/`), it asserts the plan name exists in `SEED_SUBSCRIPTIONS.plans`.
3. **Module validation** — iterates every `div.tw-min-w-0.tw-flex-1` that contains a `div.tw-text-xs:not(.tw-text-textSecondary)`. Reads the module code text and asserts a matching entry exists in `SEED_SUBSCRIPTIONS.modules` by `code`. Fails with a message naming the unrecognized code.
4. **Receipt pack validation** — if the "Paquetes de comprobantes" header is visible, iterates the `.v-chip` elements in the adjacent grid and asserts each chip text matches a `quantity` in `SEED_SUBSCRIPTIONS.receipts`. The special value `"-1"` is treated as equivalent to `"Ilimitados"`.

**`validateSubsidiaryCapabilityBadges` — what it checks:**

1. Navigates to `/admin/subsidiaries/add` and waits for "Agregar una Sucursal" to appear.
2. Waits for `span.tw-bg-primary.tw-text-white.tw-rounded-br-md.tw-rounded-tl-md` (blue badge chips) to be visible.
3. For each badge, asserts that its text matches **either** a `name` in `SEED_SUBSCRIPTIONS.modules` **or** a label in `SEED_SUBSCRIPTIONS.capabilityLabels`. Both lookups are accent-insensitive. Fails with a message naming the unrecognized badge text.

**`SEED_SUBSCRIPTIONS` catalogue (in `herness/subscriptions-seed.js`):**

Modules (15 entries):

| Code | Name |
|---|---|
| `BN001` | Módulo para uso de banner |
| `CS001` | Módulo para uso de productos talla color |
| `VB001` | Módulo para multinegocio |
| `PS001` | Módulo para uso de productos Serie |
| `KDS001` | Módulo para uso de KDS en restaurantes |
| `WR001` | Módulo para garantías |
| `DT001` | Módulo para documentos personalizados |
| `TS001` | Tesorería |
| `Res001` | Suscripción Restaurantes |
| `S001` | Subsidios |
| `BD008` | Balanzas digitales |
| `SC001` | Recargos |
| `MW001` | Multibodegas |
| `US-001` | Sucursales ilimitadas |
| `AC001` | Modulo Contable |

Receipt packs (13 entries): quantities `10`, `25`, `50`, `100`, `500`, `600`, `1000`, `1200`, `5000`, `10000`, `20000`, `50000`, `Ilimitados`.

Plans (7 entries): `Todos los permisos`, `Gratuito`, `Lite`, `Básico`, `Pyme`, `MAX`, `One (pyme limitado)`.

Capability labels (7 entries): `Maneja Restaurantes`, `Maneja Varios Negocios`, `Maneja Balanzas`, `Maneja Subsidios`, `Maneja Listado de Precios`, `Maneja Cotizaciones`, `Multibodegas`.

**No API endpoints are exercised** — both functions are pure UI read/assertion.

**Precondition:** The tenant must have a subscription plan assigned. If the tenant has no plan or the plan element is hidden, the plan-validation step is silently skipped (guarded by `isVisible()`). The receipt-pack step is similarly skipped if the "Paquetes de comprobantes" section is absent.

---

### 6. `waybill-long-product-name.spec.js`

**What it tests:** That internal and external waybills render correctly when the product name is very long, catching layout/truncation bugs.

**authType:** `getElectronicInvoicingAuthType()` (electronic invoicing subsidiary)

**Test structure:** `test.describe.serial`, two tests.

**Product used:** `SEED.products.estandarLargo` — `"Alitas de Pollo Crispy Extra Crujientes en Salsa BBQ Ahumada con Miel, Acompañadas de Papas Fritas Artesanales, Aderezo Especial de la Casa y Cebolla Caramelizada"` (code `Ali000000002`)

**Test 1 — Internal waybill:**

```
fillInternalWaybillForm  →  /admin/waybills/add  (type: internal)
fillVehiclePlate         →  SEED.waybills.vehiclePlate ("AAC-0123")
assignCarrier            →  method: "cedula"
fillAddressDetails       →  address, reason, route, destinationSubsidiary
searchAndSelectShipmentProduct  →  SEED.products.estandarLargo.name
fillShipmentAmount       →  SEED.waybills.shipmentAmountInternal ("1.23233356728372")
submitWaybillAndVerify   →  POST /api/v2/billing/waybills → 201
                         →  assert snackbar "Proceso realizado correctamente"
                         →  assert redirect to /admin/waybills/list
```

**Test 2 — External waybill:**

```
runAdminSaleFlow         →  creates a sale with SEED.products.estandarLargo and SEED.clients.test
fillExternalWaybillForm  →  /admin/waybills/add  (type: external, saleIndex: 0)
                            opens "Ventas Electrónicas Autorizadas" modal, picks first row
fillVehiclePlate         →  SEED.waybills.vehiclePlate
assignCarrier            →  method: "cedula"
fillAddressDetails       →  address, reason, route  (no destinationSubsidiary for external)
selectFirstAvailableShipmentProductFromSale  →  picks from the linked sale's items
fillShipmentAmount       →  SEED.waybills.shipmentAmountExternal ("1")
submitWaybillAndVerify   →  POST /api/v2/billing/waybills → 201
```

**Carrier assignment ("cedula" method):**
1. Fill `input[placeholder="Ingresa Cédula o RUC"]` with `SEED.clients.carrier.cedula` (`"1000000001"`)
2. Click the search button on that field
3. Dialog "Agregar Empleado" opens — assert identity type is `CEDULA`, input value is `"1000000001"`, name field has `"Empleado Test 1"`
4. Click "Guardar Empleado"

**Preconditions:**
- `SEED.clients.carrier` employee (`cedula: "1000000001"`, name `"Empleado Test 1"`) must exist in the tenant
- `SEED.clients.test` (`cedula: "0000000001"`) must exist (for the external waybill's sale)
- `SEED.pos.warehouse` (`"Bodega de Ventas W001"`) and `SEED.pos.checkout` (`"Caja 020 - 020"`) must exist
- The electronic invoicing subsidiary must have at least one authorized electronic sale available in the waybill modal (test 2)

---

## Auth resolution reference

The suite uses three auth identities. Which one a spec uses is determined at the top of each file:

| Identity | `storageState` file | Subsidiary | Dispatch enabled |
|---|---|---|---|
| `retail` | `retail-session.json` | Wanqara Comercios 100 | No |
| `dispatch` | `dispatch-session.json` | Wanqara Comercios Dispatch 101 | Yes |
| `restaurant` | `restaurant-session.json` | Wanqara Restaurant 102 | No |
| `getElectronicInvoicingAuthType()` | Resolves to whichever of the above has `SEED.subsidiaries.*.name === "Wanqara 001"` | Wanqara 001 | — |

Sessions are pre-minted by the `setup` project (`auth.setup.js`) before any Release test runs. If a session is revoked mid-run, `ensureAuthenticated` will attempt to re-login up to 3 times (`MAX_SESSION_REPAIRS`).

---

## Seed data summary

All global constants live in `e2e/Wanqara/harness/seed.js`. The subscriptions spec uses its own catalogue in `herness/subscriptions-seed.js`.

| Constant | Value | Used by |
|---|---|---|
| `SEED.clients.test` | `{ name: "Usuario Test", cedula: "0000000001" }` | `multiple-receivables`, `waybill-long-product-name` |
| `SEED.clients.consumidorFinal` | `{ cedula: "0000000001" }` | `cancel-sales` (POS flows) |
| `SEED.clients.carrier` | `{ cedula: "1000000001", name: "Empleado Test 1", identityType: "CEDULA" }` | `waybill-long-product-name` |
| `SEED.products.estandar` | `"Caja de alitas de pollo (100 u)"` | `cancel-sales`, `pos-print-ticket` |
| `SEED.products.estandarLargo` | Long name (see above), code `Ali000000002` | `waybill-long-product-name` |
| `SEED.pos.warehouse` | `"Bodega de Ventas W001"` | `waybill-long-product-name` |
| `SEED.pos.checkout` | `"Caja 020 - 020"` | `waybill-long-product-name` |
| `SEED.waybills.vehiclePlate` | `"AAC-0123"` | `waybill-long-product-name` |
| `SEED.recipeDecimals` | See recipe table above | `recipe-decimals-validation` |
| `SEED.documentTypes.facturaElectronica` | `"Factura electrónica"` | `waybill-long-product-name` |
| `SEED_SUBSCRIPTIONS` | Catalogue of 15 modules, 13 receipt packs, 7 plans, 7 capability labels | `subscriptions-overview` |

`getDynamicDocumentType(authType)` returns `"Factura electrónica"` when the authType's subsidiary is `"Wanqara 001"`, otherwise `"Recibos"`.

---

## Conventions this suite follows

- **`test.describe.serial`** is used when tests inside a group are order-dependent (one test creates data the next test consumes). `multiple-receivables` and `subscriptions-overview` use plain `describe` because both are fully self-contained.
- **`browser.newContext`** is used instead of the project `storageState` when a single file needs more than one authType (only `cancel-sales.spec.js`).
- **Soft assertions** (`expect.soft`) are used in `generateAndViewPDF` because PDF rendering failures are monitored but should not block the deletion step that follows.
- **`test.setTimeout`** is set explicitly on each test (60 000 – 240 000 ms) because release flows are longer than the project default.
- **Conditional assertions** (`if (await element.isVisible())`) are used in `validateSubscriptionsOverview` where the presence of a plan or receipt-pack section depends on tenant configuration. This allows the spec to run on any tenant without failing due to features that are simply inactive.
- Helper functions in `herness/` do not call `page.goto` for navigation — they assume the caller has already landed on the correct page or route, except where documented otherwise (e.g., `cancelFirstSaleAndVerify` always starts by going to `/admin/sales/list`; `validateSubsidiaryCapabilityBadges` calls `page.goto` internally to reach `/admin/subsidiaries/add`).
- **Spec-local seed** (`subscriptions-seed.js`) is used when the catalogue belongs exclusively to one spec's domain and would be noise in the global `seed.js`. The global `seed.js` remains for cross-spec shared data only.