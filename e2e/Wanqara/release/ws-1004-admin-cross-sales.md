# WS-1004 — Anti-Cross Validation in Sales and POS

**Files:**
- `e2e/Wanqara/release/ws-1004-admin-cross-sales.spec.js`
- `e2e/Wanqara/release/ws-1004-pos-sales.spec.js`
- `e2e/Wanqara/release/herness/ws-1004-admin-flow.js`
- `e2e/Wanqara/release/herness/ws-1004-pos-flow.js`
- `e2e/Wanqara/release/herness/ws-1004-seed.js`

**Suite:** Release (`@release`)
**Playwright project:** `Release`
**Session states used:** `retail-session.json`, `dispatch-session.json`, `restaurant-session.json`
**Tenant precondition:** `1792780241001`

---

## What is being tested

When a user switches branches (subsidiaries) in the Wanqara UI and then creates a sale or presale, the system must bill against the **subsidiary that owns the selected checkout (bodega + caja)**, not against the subsidiary that was active in the user's profile at the time of the action.

A cross-sale occurs when `payload.subsidiary.id` does not match `payload.checkout.subsidiary_id` in the POST request body. Every flow in this spec intercepts that request and asserts those two IDs are equal, preventing silent cross-subsidiary billing.

This validation applies to three transaction types:
- **Administrative Sales** (`/api/v2/billing/sales`)
- **Administrative Presales** (`/api/v2/billing/pre-sales`)
- **POS Sales** (`/api/v2/pos/sales`) — including retail, dispatch, and restaurant branches

---

## Seed

### `RELEASE_SEED` (`ws-1004-seed.js`)

Defines the three branches and their valid bodega/caja combinations that will be iterated in the administrative tests:

| Branch | Bodega | Caja |
|---|---|---|
| `001 - Wanqara 001` | Bodega de Garantias | Caja 020 |
| `001 - Wanqara 001` | Bodega de Showroom | 021 |
| `001 - Wanqara 001` | Bodega de Backup | Caja 020 |
| `100 - Wanqara Comercios 100` | Bodega Wanqara Comercios 01 | Caja Wanqara Comercios 01 |
| `100 - Wanqara Comercios 100` | Bodega Wanqara Comercios 02 | Caja Wanqara Comercios 02 |
| `101 - Wanqara Comercios Dispatch 101` | Bodega Wanqara Comercios Dispatch 01 | Caja Wanqara Comercios Dispatch 01 |
| `101 - Wanqara Comercios Dispatch 101` | Bodega Wanqara Comercios Dispatch 02 | Caja Wanqara Comercios Dispatch 02 |

### Global `SEED` references used

- `SEED.products.estandar` — the standard product added to every transaction
- `SEED.clients.consumidorFinal` — the client assigned by cédula in every transaction
- `SEED.documentTypes.recibos` — the document type selected in every transaction
- `SEED.paymentMethods.efectivo` — the payment method selected in every transaction

---

## Admin flow helpers (`ws-1004-admin-flow.js`)

These helpers are re-exports or thin wrappers of shared admin harness functions. They are the building blocks for the admin spec.

### `selectCustomCheckout(page, bodegaName, cajaName)`

Selects a specific bodega and caja from the dropdown fields in the admin transaction form. Uses XPath-relative locators anchored to the label text to find the corresponding `v-input`. Waits for the listbox to appear and disappear on each selection.

**Important:** This always selects a specific combination — it never falls back to the first available option. This is what makes cross-branch testing deterministic.

### `selectCustomDocumentType(page, documentType)`

Checks the current value of the "Tipo de Documento" field. If the desired document type is already selected (by text or by known code — e.g., `"01"` for Factura), it skips the interaction. Otherwise it opens the dropdown, finds the matching option by regex, and clicks it.

### `selectClientByCedula(page, cedula)`

Types the cédula into the client search input and presses Enter. Handles the optional client modal that appears for new or ambiguous identities: if the modal requires an identification type, selects `CÉDULA`, re-triggers the search, and saves. Asserts both the snackbar confirmation and the cédula being visible in the main form.

### `searchAndSelectProduct(page, { name, searchTerm })`

Searches for a product by name or a custom search term using the `#searchInput` field. Clicks the first matching result. Closes any open profile overlay before searching.

### `selectPaymentMethod(page, methodName)`

Scrolls to and clicks the payment method item by exact text.

### `switchSubsidiaryFromProfile(page, targetSubsidiary)`

Switches the active subsidiary from the profile modal in the header. Uses the short name (last segment after `-`) to check if the branch is already active before opening the modal, avoiding unnecessary interactions. Waits for `networkidle` after switching and asserts the header reflects the new branch.

### `submitValidatedAdminTransaction(page, endpointPattern)`

Core validation helper. Clicks "Guardar", waits for the POST response to the given endpoint, then **asserts the payload**:

1. `payload.subsidiary` must be defined.
2. `payload.checkout` must be defined.
3. If `payload.checkout.subsidiary_id` is present, it must equal `payload.subsidiary.id`.

The assertion message on failure reads:
> `SEQUENTIAL ALERT: Attempted to bill with subsidiary X but the checkout belongs to Y`

Finally, asserts the success snackbar containing `/guardada|correctamente/i`.

---

## POS flow helpers (`ws-1004-pos-flow.js`)

### `completeValidatedPosPayment(page)`

Selects the `efectivo` payment method, clicks "Finalizar Venta", intercepts the POST to `/api/v2/pos/sales`, and **asserts the payload**:

1. `payload.subsidiary` must be defined.
2. If `payload.subsidiary.open_cash_register.checkout.subsidiary_id` is present, it must equal `payload.subsidiary.id`.

The assertion message on failure reads:
> `CROSSMATCH DETECTED IN POS: Subsidiary (X) vs Cash Register (Y)`

Finally asserts the "Venta Realizada" snackbar.

### `runReleasePosSaleFlow(page, tenantBaseUrl, documentType)`

Full self-contained POS commerce flow:
1. Navigates to `/pos/home` via `ensureAuthenticated`.
2. Checks the current document type selector; switches to the target type if needed.
3. Adds `SEED.products.estandar` via `searchAndSelectProduct`.
4. Clicks "Terminar Venta" and waits for navigation to `/pos/payments`.
5. Calls `completeValidatedPosPayment`.

### `finalizeValidatedRestaurantSale(page)`

Used after an order has already been opened in the Restaurant POS. Assigns `SEED.clients.consumidorFinal` by cédula, clicks "Terminar Venta", waits for navigation to `/pos/restaurant-payments`, then calls `completeValidatedPosPayment`.

---

## Spec: Administrative Sales (`ws-1004-admin-cross-sales.spec.js`)

**Session:** `retail`
**Timeout per test:** 300 000 ms

### Test 1 — `ws-1004-sale-combinations`

Iterates every `sucursal → combo` pair in `RELEASE_SEED`. For each iteration:

1. Switches the profile to the branch (`switchSubsidiaryFromProfile`).
2. Navigates to `/admin/ventas/add`.
3. Selects the specific bodega/caja (`selectCustomCheckout`).
4. Sets document type, client, product, and payment method.
5. Submits and validates the payload with `submitValidatedAdminTransaction("/api/v2/billing/sales")`.

Each iteration runs as a named `test.step` for traceability in the Playwright report.

### Test 2 — `ws-1004-presale-combinations`

Identical structure to Test 1 but targets `/admin/pre-sale/add` and validates against `/api/v2/billing/pre-sales`. Confirms the same cross-subsidiary protection exists in the presale flow.

---

## Spec: POS Sales (`ws-1004-pos-sales.spec.js`)

### Commerce 100 — `ws-1004-pos-retail`

**Session:** `retail` | **Timeout:** 120 000 ms

Runs `runReleasePosSaleFlow` for branch 100 with `SEED.documentTypes.recibos`. Validates that the POS sale payload does not contain a cross-subsidiary mismatch.

### Commerce Dispatch 101 — `ws-1004-pos-dispatch`

**Session:** `dispatch` | **Timeout:** 120 000 ms

Same flow as retail but authenticated against branch 101 (`dispatch` session). Ensures dispatch-branch POS sales are also covered.

### Restaurant — `ws-1004-pos-restaurant`

**Session:** `restaurant` | **Serial execution** | **Timeout:** 180 000 ms
**Requires:** both POS credentials and Chef credentials (`requireChefCredentials`).

**`beforeAll`** — Cleanup: opens a new browser context with the restaurant session and calls `closeAllActiveOrders` to ensure no stale orders interfere.

**Test flow:**
1. `createChefOrder(page)` — creates an order in the Chef interface and returns the active table name.
2. `navigateToRestaurantPOS(page, tenantBaseUrl)` — switches to the Restaurant POS.
3. `openAndSelectOrder(page, activeTableName)` — finds and opens the order created in step 1.
4. Clicks "Cobrar / Procesar pago".
5. `finalizeValidatedRestaurantSale(page)` — assigns the client, finalizes, and validates the payload.

The restaurant test uses electronic invoicing as configured by default in the seed.

---

## Coverage matrix

| Flow | Branch | Transaction type | Endpoint validated | Session |
|---|---|---|---|---|
| Admin sales iteration | 001 (3 combos) | Sale | `/api/v2/billing/sales` | retail |
| Admin sales iteration | 100 (2 combos) | Sale | `/api/v2/billing/sales` | retail |
| Admin sales iteration | 101 (2 combos) | Sale | `/api/v2/billing/sales` | retail |
| Admin presales iteration | 001 (3 combos) | Presale | `/api/v2/billing/pre-sales` | retail |
| Admin presales iteration | 100 (2 combos) | Presale | `/api/v2/billing/pre-sales` | retail |
| Admin presales iteration | 101 (2 combos) | Presale | `/api/v2/billing/pre-sales` | retail |
| POS retail | 100 | POS sale | `/api/v2/pos/sales` | retail |
| POS dispatch | 101 | POS sale | `/api/v2/pos/sales` | dispatch |
| POS restaurant | Restaurant | POS sale | `/api/v2/pos/sales` | restaurant |

---

## Key assertion pattern

The cross-match guard appears in two variants depending on the context:

**Admin / billing context** (`submitValidatedAdminTransaction`):
```
payload.subsidiary.id === payload.checkout.subsidiary_id
```

**POS context** (`completeValidatedPosPayment`):
```
payload.subsidiary.id === payload.subsidiary.open_cash_register.checkout.subsidiary_id
```

Both use `expect(...).toBe(...)` with a descriptive failure message that names the conflicting IDs, making CI failures immediately actionable without needing to inspect raw payloads.