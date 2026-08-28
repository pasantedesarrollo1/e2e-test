# Regression — Transactions Reference

**Specs location:** `e2e/Wanqara/regression/transactions/`
**Playwright project:** `Admin-Inventory`
**Test match pattern:** `/Wanqara/regression/(inventory|transactions|settings)/.*\.spec\.js/`
**Tag:** `@regression`
**Run command:** `npx playwright test --project=Admin-Inventory`

---

## Folder structure

```
regression/transactions/
├── sales/
│   ├── admin-sale-dispatch.spec.js
│   ├── admin-sale-documents.spec.js
│   ├── admin-sale-modifiers.spec.js
│   └── pre-sale/
│       ├── admin-pre-sale-dispatch.spec.js
│       └── admin-pre-sale-documents.spec.js
│   └── harness/
│       ├── admin-sale-flow.js
│       └── admin-pre-sale-flow.js
└── other-documents/
    └── waybills/
        ├── waybill-external.spec.js
        ├── waybill-internal.spec.js
        └── harness/
            └── waybill-flow.js
```

---

## Auth identities used

| Identity | `storageState` file | Subsidiary | Dispatch |
|---|---|---|---|
| `retail` | `retail-session.json` | Wanqara Comercios 100 | No |
| `dispatch` | `dispatch-session.json` | Wanqara Comercios Dispatch 101 | Yes |

Sessions are pre-minted by the `setup` project (`auth.setup.js`). Each spec file that needs a specific identity calls `test.use({ storageState: getSessionPath(authType) })` inside its `test.describe` block.

**Electronic invoicing identity:** Several specs call `getElectronicInvoicingAuthType()` to resolve which identity has the `"Wanqara 001"` subsidiary (the one authorized to emit `facturaElectronica`). The function checks `SEED.subsidiaries` in order: `retail` → `restaurant` → `dispatch`. In the standard seeded environment, `retail` has `"Wanqara 001"` and is returned. Waybill specs and `admin-sale-documents.spec.js` rely on this.

**Dynamic document type:** `getDynamicDocumentType(authType)` returns `SEED.documentTypes.facturaElectronica` if that identity's subsidiary is `"Wanqara 001"`, otherwise `SEED.documentTypes.recibos`. Used by dispatch and retail specs that must select the correct document type without hardcoding it.

---

## Domain-level harness — `sales/harness/`

### `admin-sale-flow.js`

The orchestration module for all admin sale specs (`admin-sale-dispatch`, `admin-sale-documents`, `admin-sale-modifiers`). Provides both a full-flow runner and individual step exports.

**Entry point URL:** `/admin/ventas/add`
**Submit endpoint:** `POST /api/v2/billing/sales → 200`
**Success snackbar:** `"Venta guardada"` (partial match)

#### Individual step exports

**`selectCheckout(page)`**

Waits for `/admin/ventas/add` URL, then:

```
waits 1000ms for page to stabilize

if "Bodega" label visible:
  reads Bodega wrapper innerText (strips label and asterisk)
  if empty → assignManualBodega(page):
    └─ clicks .v-icon in Bodega wrapper (dropdown trigger)
    └─ waits for [role='listbox'] to be visible (retries up to 15 000ms with toPass)
    └─ prefers option matching SEED.pos.warehouse ("Bodega de Ventas W001")
    └─ falls back to first option if not found
    └─ asserts listbox gone

reads "Punto de Venta" wrapper innerText (strips label and asterisk)
if empty → assignManualCaja(page):
  └─ same retry pattern → clicks first option

clicks page main area at (10, 10) to close any open overlays
waits 200ms
```

**`selectDocumentType(page, documentType)`**

```
if documentType is falsy → returns immediately (no-op)

locates "Tipo de Documento" label in main
reads current value from the adjacent v-input wrapper
normalizes text (strips curly quotes, collapses whitespace)

if already selected (matches target or contains factura code "01") → returns

clicks dropdown icon in wrapper
waits for active [role='listbox']
clicks option matching documentType (case-insensitive regex)
asserts listbox gone
presses Escape to close any residual overlay
```

**`selectClientByCedula(page, cedula)`**

```
clicks and clears "Ingresa Cédula o RUC" input
pressSequentially(cedula, delay: 50ms)
waits 300ms
presses Enter

if client modal appears (.v-overlay__content:not(.v-snackbar__wrapper) with "Cliente"):
  if "Seleccione un tipo de identificación" alert visible:
    clicks .v-select for identity type → opens active listbox
    clicks "CEDULA" option → asserts listbox gone
    focuses identity input (already has cedula)
    clicks magnify button or presses Enter
    waits 1000ms for backend lookup
  if "Guardar Cliente" button visible:
    waits for it to be enabled (10 000ms)
    clicks it (force)
    asserts modal gone (5 000ms)

asserts snackbar "Cliente asignado correctamente" visible (15 000ms, soft)
asserts main contains cedula text (15 000ms)
```

**`searchAndSelectProduct(page, { name, searchTerm })`**

```
if profile overlay ("Cerrar Sesión") is visible → presses Escape

locates #searchInput
clears input, waits 300ms
pressSequentially(searchTerm || name, delay: 30ms)
presses Enter

waits for getByText(name) to be visible (20 000ms)
clicks it (force)
```

**`applyGeneralDiscount(page, rate)`**

```
clicks "Descuento General" button
asserts dialog containing "Descuento" visible
fills first input → rate (default: SEED.discount.rate = "3.3337373372323")
clicks "Asignar descuento"
asserts dialog gone
```

**`applyManualSurcharge(page, rate)`**

```
clicks "Más opciones de porcentaje" button
clicks "Aplicar Recargo" list item
fills "Ingresa un Recargo" input → rate (default: SEED.surcharge.rate = "3.3337373372323")
clicks "Asignar recargo"
races against POST /api/v1/pos/* (optional, .catch(() => {}))
asserts input gone
```

**`selectPaymentMethod(page, methodName)`**

```
scrolls getByText(methodName, exact: true) into view
clicks it (force)
default: SEED.paymentMethods.efectivo.label = "EFECTIVO"
```

**`submitAdminSale(page)`**

```
locates "Guardar" button (exact, first)
asserts visible (10 000ms)
asserts enabled (15 000ms)
races:
  └─ page.waitForResponse: POST /api/v2/billing/sales → 200 (30 000ms)
  └─ button.click(force)
asserts snackbar "Venta guardada" visible (15 000ms)
```

#### Full-flow runner

**`runAdminSaleFlow(page, opts)`**

```
opts: {
  tenantBaseUrl,
  authType,
  documentType,
  clientCedula,      ← default: SEED.clients.consumidorFinal.cedula ("0000000001")
  productName,       ← if null, caller must add products via beforeFinish
  searchTerm,
  beforeFinish,      ← async (page) => { ... } hook called after product add, before payment
  paymentMethod,     ← default: "EFECTIVO"
  skipNavigation     ← if true, skips ensureAuthenticated + waitURL (caller already navigated)
}

if !skipNavigation:
  ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/ventas/add", authType })
  waitURL /admin/ventas/add

selectCheckout(page)
selectDocumentType(page, documentType)
selectClientByCedula(page, clientCedula)

if productName:
  searchAndSelectProduct(page, { name: productName, searchTerm })

if beforeFinish:
  await beforeFinish(page)

selectPaymentMethod(page, paymentMethod)
submitAdminSale(page)
```

---

### `admin-pre-sale-flow.js`

Structurally identical to `admin-sale-flow.js` with three differences:

| Aspect | `admin-sale-flow.js` | `admin-pre-sale-flow.js` |
|---|---|---|
| Entry URL | `/admin/ventas/add` | `/admin/pre-sale/add` |
| Submit endpoint | `POST /api/v2/billing/sales → 200` | `POST /api/v2/billing/pre-sales → 200` |
| Success snackbar | `"Venta guardada"` | `"guardada"` or `"correctamente"` (partial match) |
| `waitURL` pattern inside `selectCheckout` | `/admin/ventas/add` | `/admin/pre-sale/add` |

All exports are identically named and behave identically: `selectCheckout`, `selectDocumentType`, `selectClientByCedula`, `searchAndSelectProduct`, `applyGeneralDiscount`, `applyManualSurcharge`, `selectPaymentMethod`, `submitAdminPreSale`, `runAdminPreSaleFlow`.

Specs in `sales/pre-sale/` import from `../harness/admin-pre-sale-flow.js`. Specs in `sales/` import from `./harness/admin-sale-flow.js`.

---

## Domain-level harness — `other-documents/waybills/harness/`

### `waybill-flow.js`

All exports are shared between `waybill-internal.spec.js` and `waybill-external.spec.js`.

#### Constants

**`CARRIER_CASES`**

Array of 3 carrier assignment methods exercised in sequence by both waybill specs:

```javascript
[
  { label: "por cédula",                 carrier: "cedula"   },
  { label: "por selector",               carrier: "selector" },
  { label: "por formulario de empleado", carrier: "form"     },
]
```

Each waybill spec iterates `CARRIER_CASES`, assigns the carrier, asserts the result, then clears the assignment before moving to the next — except for the last entry, which remains assigned for form submission.

#### Carrier assignment exports

**`assignCarrier(page, carrier)`**

Dispatcher that routes to one of three sub-functions:

| `carrier` value | Sub-function called |
|---|---|
| `"cedula"` | `searchCarrierByCedula` → `verifyAndSaveCarrierModal` |
| `"selector"` | `openCarrierSelectorAndSelect` |
| `"form"` | `addCarrierViaEmployeeForm` |

All three methods must result in the carrier display showing `"Empleado Test 1 ... Identificación:"` text, which is the assertion used after each `assignCarrier` call.

**`searchCarrierByCedula(page, cedula)`**

```
fills "Ingresa Cédula o RUC" input → cedula (SEED.clients.carrier.cedula = "1000000001")
locates the search button (last button inside the .v-text-field wrapping that input)
clicks search button
```

**`verifyAndSaveCarrierModal(page, { expectedIdentityType, expectedIdentity, expectedName })`**

Called after `searchCarrierByCedula`. The search triggers an "Agregar Empleado" dialog.

```
asserts .v-select inside dialog contains expectedIdentityType ("CEDULA")
asserts #employee-identity-input has value expectedIdentity ("1000000001")
asserts input containing expectedName ("Empleado Test 1") is visible
clicks "Guardar Empleado" button
asserts dialog gone
```

**`openCarrierSelectorAndSelect(page, searchTerm)`**

```
clicks the button adjacent to the cedula .v-text-field (selector trigger)
waits for modal with "Busca lo que necesites" search box
fills search textbox → searchTerm ("1000000001")
waits for .v-data-table__tr containing searchTerm
clicks first matching row
asserts modal gone
```

**`addCarrierViaEmployeeForm(page, { identityType, identity, expectedName })`**

```
clicks search button on the cedula field (same as searchCarrierByCedula)
dialog "Agregar Empleado" appears (empty — no auto-lookup yet)

clicks .v-select (identity type dropdown, first in dialog)
waits for option matching /^identityType$/ → clicks it ("CEDULA")
asserts listbox gone

locates #employee-identity-input
asserts not readonly
fills → identity ("1000000001")

clicks magnify button (.v-input__append button)
waits for input containing expectedName to be visible (20 000ms)

clicks "Guardar Empleado"
asserts dialog gone
```

#### Form section exports

**`openAddWaybillDialog(page, { tenantBaseUrl })`**

```
calls getElectronicInvoicingAuthType() → authType
ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/waybills/list", authType })
asserts URL /admin/waybills/list

clicks "Agregar Guía" button
asserts dialog "Nueva guía de remisión" visible
returns dialog locator
```

**`selectWaybillTypeAndContinue(page, dialog, type)`**

```
clicks the radio-group .v-card matching "Interna" or "Externa"
clicks "Continuar" button inside dialog
waits for URL /admin/waybills/add
```

**`fillWaybillDates(page, { startDate, finishDate })`**

```
formats dates as "YYYY-MM-DD" (accepts Date objects or pre-formatted strings)

clears and fills "Fecha de inicio" input → startDate, press Tab
clears and fills "Fecha de finalización" input → finishDate, press Tab
```

**`selectWarehouse(page, warehouseName)`**

```
scrolls "Seleccione una bodega" combobox into view
clicks it (delay 100ms)
waits for .v-list-item containing warehouseName (3 000ms, retries once with force-click)
clicks option
asserts option gone
```

**`selectCheckout(page, checkoutName)`**

```
same pattern as selectWarehouse but targets "Seleccione un Punto de Venta" combobox
```

**`fillVehiclePlate(page, plate)`**

```
fills "Ingrese la placa del vehiculo" placeholder → plate, press Tab
```

**`fillAddressDetails(page, { address, reason, route, destinationSubsidiary })`**

```
fills "Ingrese la dirección completa" → address, press Tab
fills "Ingrese la razón de la entrega" → reason, press Tab
fills "Ingrese la ruta de la entrega" → route, press Tab

if destinationSubsidiary:
  clicks "Seleccione Sucursal Destino" combobox
  waits for active .v-list-item (3 000ms, retries once)
  clicks first option (ignores the destinationSubsidiary string value — always picks first)
  asserts option gone
```

**`searchAndSelectShipmentProduct(page, productName)`** — internal waybills only

```
fills #searchInput → productName
clicks .v-virtual-scroll .v-card containing productName
asserts .v-card containing "seleccionado" visible
```

**`fillShipmentAmount(page, amount)`**

```
fills "Ingrese la cantidad a enviar" → amount, press Tab
```

**`submitWaybillAndVerify(page, { tenantBaseUrl })`**

```
clicks "Guardar" button (force)
waits for POST /api/v2/billing/waybills → 201
asserts snackbar "Proceso realizado correctamente"
asserts URL /admin/waybills/list
```

**`selectSaleFromModal(page, index)`** — external waybills only

```
clicks "Seleccionar venta" button
asserts modal "Ventas Electrónicas Autorizadas" visible
clicks .v-data-table__tr at index (default: 0 = first row)
asserts modal gone
```

**`selectFirstAvailableShipmentProductFromSale(page)`** — external waybills only

```
locates the last .v-autocomplete on the page → clicks its .v-field
waits for active .v-list-item (3 000ms, retries once with force-click)
if list is empty after retry → throws "The selected sale has no remaining quantity available for shipment."
clicks first option
asserts option gone
```

#### Full-flow composite exports

**`fillInternalWaybillForm(page, { tenantBaseUrl, startDate, finishDate, warehouseName, checkoutName })`**

```
today = new Date()

openAddWaybillDialog(page, { tenantBaseUrl })
selectWaybillTypeAndContinue(page, dialog, "internal")
fillWaybillDates(page, { startDate: startDate ?? today, finishDate: finishDate ?? today })
selectWarehouse(page, warehouseName)
selectCheckout(page, checkoutName)
```

**`fillExternalWaybillForm(page, { tenantBaseUrl, startDate, finishDate, checkoutName, saleIndex })`**

```
today = new Date()

openAddWaybillDialog(page, { tenantBaseUrl })
selectWaybillTypeAndContinue(page, dialog, "external")
selectSaleFromModal(page, saleIndex ?? 0)
fillWaybillDates(page, { startDate: startDate ?? today, finishDate: finishDate ?? today })
selectCheckout(page, checkoutName)
```

Note: external waybills do not call `selectWarehouse` — the warehouse is inherited from the selected sale.

---

## Specs — Sales (`sales/`)

### 1. `admin-sale-documents.spec.js`

**What it tests:** That the admin sale form correctly processes a single standard product sale under two different document types: `facturaElectronica` and `recibos`.

**Test structure:** Two independent `test.describe` groups, each with one test. Not serial.

**`setTimeout`:** 120 000 ms (both tests)

**Groups and identities:**

| Group | authType | Document type | storageState |
|---|---|---|---|
| "Admin Sales — Electronic Invoice" | `getElectronicInvoicingAuthType()` (resolves to `retail`) | `SEED.documentTypes.facturaElectronica` = `"Factura electrónica"` | `retail-session.json` |
| "Admin Sales — Receipts (without dispatch)" | `retail` | `SEED.documentTypes.recibos` = `"Recibos"` | `retail-session.json` |

**Flow (both groups, via `runAdminSaleFlow`):**

```
ensureAuthenticated → /admin/ventas/add
selectCheckout (Bodega + Punto de Venta)
selectDocumentType → target document type
selectClientByCedula(SEED.clients.consumidorFinal.cedula = "0000000001")
searchAndSelectProduct(SEED.products.estandar.name = "Caja de alitas de pollo (100 u)")
selectPaymentMethod("EFECTIVO")
submitAdminSale
└─ wait POST /api/v2/billing/sales → 200
└─ snackbar "Venta guardada"
```

**Endpoints exercised:** `POST /api/v2/billing/sales → 200`

---

### 2. `admin-sale-dispatch.spec.js`

**What it tests:** That a mixed-cart admin sale (Estandar + Serie + TallaColor) completes correctly both when post-sale dispatch is enabled and when it is disabled. The difference in behavior is the series-selection modal: with dispatch enabled, the modal is skipped; without dispatch, `selectFirstSerie` must handle it.

**Test structure:** Two independent `test.describe` groups, each with one test. Not serial.

**`setTimeout`:** 120 000 ms (both tests)

**Groups and identities:**

| Group | authType | Document type | Dispatch | storageState |
|---|---|---|---|---|
| "Admin Sales — Mixed Cart WITH Subsequent Dispatch" | `dispatch` | `getDynamicDocumentType("dispatch")` | Yes | `dispatch-session.json` |
| "Admin Sales — Mixed Cart WITHOUT Subsequent Dispatch" | `retail` | `getDynamicDocumentType("retail")` | No | `retail-session.json` |

**`buildMixedCart(page, dispatchEnabled)` — local helper (defined inside the spec):**

```
searchAndSelectProduct({ name: SEED.products.estandar.name })
searchAndSelectProduct({ name: SEED.products.serie.name })
  └─ if !dispatchEnabled → selectFirstSerie(page)
       └─ handles series-selection modal: clicks first .tw-font-mono.tw-text-sm, clicks "Guardar"
searchAndSelectProduct({ name: SEED.products.tallaColor.name })
  └─ always: selectFirstVariant(page)
       └─ handles "Variantes encontradas" modal: clicks "Agregar" on first row, clicks "Agregar Selección"
```

**Flow (both groups, via `runAdminSaleFlow` with `beforeFinish`):**

```
ensureAuthenticated → /admin/ventas/add
selectCheckout
selectDocumentType
selectClientByCedula("0000000001")
[no productName — beforeFinish handles product addition]
beforeFinish: buildMixedCart(page, dispatchEnabled)
selectPaymentMethod("EFECTIVO")
submitAdminSale
└─ wait POST /api/v2/billing/sales → 200
└─ snackbar "Venta guardada"
```

**Key detail — series modal and dispatch:** When `dispatch` authType is active (subsidiary has dispatch enabled), the backend processes the serie product without prompting for a serial number selection in the admin form. When `retail` is active (no dispatch), the modal appears and `selectFirstSerie` is required to close it before the cart is valid.

**Endpoints exercised:** `POST /api/v2/billing/sales → 200`

---

### 3. `admin-sale-modifiers.spec.js`

**What it tests:** That applying a general discount and a manual surcharge both work correctly in the admin sale form, under both dispatch and non-dispatch identities. Four tests total (2 modifiers × 2 identities).

**Test structure:** Two `test.describe` groups (dispatch, retail), each containing two tests. Not serial. Groups are independent.

**`setTimeout`:** 120 000 ms (all 4 tests)

**Groups:**

| Group | authType | storageState |
|---|---|---|
| "Admin Sales — Sale Modifiers (without dispatch)" | `retail` | `retail-session.json` |
| "Admin Sales — Sale Modifiers (with dispatch)" | `dispatch` | `dispatch-session.json` |

**Tests per group:**

| Test | modifier | beforeFinish |
|---|---|---|
| "completes a sale applying a general discount" | `applyGeneralDiscount(page)` | `SEED.discount.rate = "3.3337373372323"` |
| "completes a sale applying a manual surcharge" | `applyManualSurcharge(page)` | `SEED.surcharge.rate = "3.3337373372323"` |

**Flow (all 4 tests, via `runAdminSaleFlow` with `beforeFinish`):**

```
ensureAuthenticated → /admin/ventas/add
selectCheckout
selectDocumentType(getDynamicDocumentType(authType))
selectClientByCedula("0000000001")
searchAndSelectProduct(SEED.products.estandar.name)
beforeFinish: applyGeneralDiscount(page) OR applyManualSurcharge(page)
selectPaymentMethod("EFECTIVO")
submitAdminSale
└─ wait POST /api/v2/billing/sales → 200
└─ snackbar "Venta guardada"
```

**Note:** These tests verify that the sale _completes_ with a modifier applied — they do not assert the financial precision of the modifier's effect. That is covered by `sale-financial-precision.spec.js` in the POS regression domain.

**Endpoints exercised:** `POST /api/v2/billing/sales → 200`

---

## Specs — Pre-Sales (`sales/pre-sale/`)

Pre-sale specs mirror their sale counterparts in structure and purpose but target the admin pre-sale form at `/admin/pre-sale/add` and submit to `POST /api/v2/billing/pre-sales`. The harness (`admin-pre-sale-flow.js`) is a parallel implementation of `admin-sale-flow.js`.

### 4. `admin-pre-sale-documents.spec.js`

**What it tests:** That the admin pre-sale form processes a single standard product under both `facturaElectronica` and `recibos` document types.

**Test structure:** Two independent `test.describe` groups, each with one test. Not serial.

**`setTimeout`:** 120 000 ms (both tests)

**Groups and identities:**

| Group | authType | Document type | storageState |
|---|---|---|---|
| "Admin Pre-Sales — Electronic Invoice" | `getElectronicInvoicingAuthType()` | `SEED.documentTypes.facturaElectronica` | `retail-session.json` |
| "Admin Pre-Sales — Receipts (without dispatch)" | `retail` | `SEED.documentTypes.recibos` | `retail-session.json` |

**Flow (both groups, via `runAdminPreSaleFlow`):**

```
ensureAuthenticated → /admin/pre-sale/add
selectCheckout
selectDocumentType
selectClientByCedula("0000000001")
searchAndSelectProduct(SEED.products.estandar.name)
selectPaymentMethod("EFECTIVO")
submitAdminPreSale
└─ wait POST /api/v2/billing/pre-sales → 200
└─ snackbar "guardada" or "correctamente"
```

**Endpoints exercised:** `POST /api/v2/billing/pre-sales → 200`

---

### 5. `admin-pre-sale-dispatch.spec.js`

**What it tests:** That a mixed-cart pre-sale (Estandar + Serie + TallaColor) completes correctly with and without dispatch. Mirrors `admin-sale-dispatch.spec.js` exactly, targeting the pre-sale endpoint.

**Test structure:** Two independent `test.describe` groups, each with one test. Not serial.

**`setTimeout`:** 120 000 ms (both tests)

**Groups and identities:**

| Group | authType | Document type | Dispatch | storageState |
|---|---|---|---|---|
| "Admin Pre-Sales — Mixed Cart WITH Subsequent Dispatch" | `dispatch` | `getDynamicDocumentType("dispatch")` | Yes | `dispatch-session.json` |
| "Admin Pre-Sales — Mixed Cart WITHOUT Subsequent Dispatch" | `retail` | `getDynamicDocumentType("retail")` | No | `retail-session.json` |

**`buildMixedCart(page, dispatchEnabled)` — local helper (defined inside the spec):**

```
searchAndSelectProduct({ name: SEED.products.estandar.name })
→ assert main contains estandar name (20 000ms)

searchAndSelectProduct({ name: SEED.products.serie.name })
→ assert main contains serie name (no selectFirstSerie called, even without dispatch)

searchAndSelectProduct({ name: SEED.products.tallaColor.name })
→ always: selectFirstVariant(page)
```

**Key difference from sale-dispatch:** In the pre-sale version, `selectFirstSerie` is **not** called even when dispatch is disabled. The pre-sale form does not trigger the serial number selection modal for the serie product — series are handled differently in the pre-sale flow.

**Flow (both groups, via `runAdminPreSaleFlow` with `beforeFinish`):**

```
ensureAuthenticated → /admin/pre-sale/add
selectCheckout
selectDocumentType
selectClientByCedula("0000000001")
[no productName — beforeFinish adds products]
beforeFinish: buildMixedCart(page, dispatchEnabled)
selectPaymentMethod("EFECTIVO")
submitAdminPreSale
└─ wait POST /api/v2/billing/pre-sales → 200
└─ snackbar "guardada" or "correctamente"
```

**Endpoints exercised:** `POST /api/v2/billing/pre-sales → 200`

---

## Specs — Waybills (`other-documents/waybills/`)

Both waybill specs are `test.describe.serial` and use the `getElectronicInvoicingAuthType()` identity (resolves to `retail` in standard environments). Both exercise `CARRIER_CASES` in sequence within a single test, clearing and reassigning the carrier between iterations.

**Common precondition for all waybill specs:** The tenant must have at least one authorized electronic sale (`facturaElectronica`) available in the "Ventas Electrónicas Autorizadas" modal (used by external waybills). The internal waybill spec does not require this.

**Carrier seed data:**

| Constant | Value |
|---|---|
| `SEED.clients.carrier.cedula` | `"1000000001"` |
| `SEED.clients.carrier.identity` | `"1000000001"` |
| `SEED.clients.carrier.identityType` | `"CEDULA"` |
| `SEED.clients.carrier.name` | `"Empleado Test 1"` |

---

### 6. `waybill-internal.spec.js`

**What it tests:** Full internal waybill creation — both the carrier-assignment coverage test (all 3 carrier methods in sequence) and a dedicated test verifying a product with a very long name fits correctly in the form.

**authType:** `getElectronicInvoicingAuthType()` (resolves to `retail`)

**Test structure:** `test.describe.serial`, 2 tests.

**`setTimeout`:** 180 000 ms (both tests)

---

**Test 1 — "creates an internal waybill validating all carrier assignment methods"**

```
Step 1 — fill form header:
  fillInternalWaybillForm(page, {
    tenantBaseUrl,
    warehouseName: SEED.pos.warehouse  = "Bodega de Ventas W001"
    checkoutName:  SEED.pos.checkout   = "Caja 020 - 020"
  })
  └─ openAddWaybillDialog → dialog "Nueva guía de remisión"
  └─ selectWaybillTypeAndContinue(page, dialog, "internal") → waitURL /admin/waybills/add
  └─ fillWaybillDates(today, today)
  └─ selectWarehouse("Bodega de Ventas W001")
  └─ selectCheckout("Caja 020 - 020")

Step 2 — vehicle plate:
  fillVehiclePlate(SEED.waybills.vehiclePlate = "AAC-0123")

Step 3 — carrier iteration (loop over CARRIER_CASES):
  for each { label, carrier } in CARRIER_CASES:
    assignCarrier(page, carrier)
    └─ cedula:    searchCarrierByCedula + verifyAndSaveCarrierModal
    └─ selector:  openCarrierSelectorAndSelect
    └─ form:      addCarrierViaEmployeeForm
    assert getByText(/Empleado Test 1.*Identificación:/i) visible

    if not last iteration:
      click clear button (.tw-flex > .tw-flex.tw-gap-1 last button)
      assert "Empleado Test 1...Identificación:" not visible

Step 4 — delivery information (carrier "form" remains assigned):
  fillAddressDetails(page, {
    address:              SEED.waybills.address              = "Dir 1"
    reason:               SEED.waybills.reason               = "razon 1"
    route:                SEED.waybills.route                = "ruta 1"
    destinationSubsidiary: SEED.waybills.destinationSubsidiary = "002 - Wanqara Retail Dispatch"
  })

Step 5 — shipment product:
  searchAndSelectShipmentProduct(page, SEED.products.estandar.name)

Step 6 — quantity:
  fillShipmentAmount(SEED.waybills.shipmentAmountInternal = "1.23233356728372")

Step 7 — submit:
  submitWaybillAndVerify(page, { tenantBaseUrl })
  └─ wait POST /api/v2/billing/waybills → 201
  └─ snackbar "Proceso realizado correctamente"
  └─ assert URL /admin/waybills/list
```

---

**Test 2 — "creates an internal waybill with a long product name"**

Tests that the UI handles products with extremely long names without truncation errors. Uses `SEED.products.estandarLargo` which has a name exceeding 200 characters.

```
fillInternalWaybillForm(page, {
  tenantBaseUrl,
  warehouseName: SEED.pos.warehouse
  checkoutName:  SEED.pos.checkout
})

fillVehiclePlate(SEED.waybills.vehiclePlate)
assignCarrier(page, "cedula")  ← only cedula method, no iteration

fillAddressDetails(page, {
  address:               SEED.waybills.address
  reason:                SEED.waybills.reason
  route:                 SEED.waybills.route
  destinationSubsidiary: SEED.waybills.destinationSubsidiary
})

searchAndSelectShipmentProduct(page, SEED.products.estandarLargo.name)
  └─ product name: "Alitas de Pollo Crispy Extra Crujientes en Salsa BBQ..."
     (full name: 195 chars, code Ali000000002)

fillShipmentAmount(SEED.waybills.shipmentAmountInternal)

submitWaybillAndVerify(page, { tenantBaseUrl })
```

**Endpoints exercised:** `POST /api/v2/billing/waybills → 201`

---

### 7. `waybill-external.spec.js`

**What it tests:** Full external waybill creation linked to an existing authorized electronic sale — both the carrier-coverage test and a long-product-name test. External waybills differ from internal ones: instead of selecting a warehouse and searching for a product freely, the form first selects an existing sale (the source of products) and then picks from that sale's line items.

**authType:** `getElectronicInvoicingAuthType()` (resolves to `retail`)

**Test structure:** `test.describe.serial`, 2 tests.

**`setTimeout`:** 180 000 ms (test 1), 240 000 ms (test 2)

**Precondition for test 2:** The second test creates a fresh sale (via `runAdminSaleFlow`) using `SEED.products.estandarLargo` before creating the waybill, ensuring a known sale with that product is available in the modal. Test 1 uses whatever authorized sales already exist (picks `saleIndex: 0`).

---

**Test 1 — "creates an external waybill validating all carrier assignment methods"**

```
Step 1 — fill form header:
  fillExternalWaybillForm(page, {
    tenantBaseUrl,
    checkoutName: SEED.pos.checkout = "Caja 020 - 020"
    saleIndex: 0   ← selects the first available authorized sale
  })
  └─ openAddWaybillDialog → dialog "Nueva guía de remisión"
  └─ selectWaybillTypeAndContinue(page, dialog, "external") → waitURL /admin/waybills/add
  └─ selectSaleFromModal(page, 0)
       └─ clicks "Seleccionar venta"
       └─ clicks first .v-data-table__tr in "Ventas Electrónicas Autorizadas" modal
  └─ fillWaybillDates(today, today)
  └─ selectCheckout("Caja 020 - 020")

Step 2 — vehicle plate:
  fillVehiclePlate(SEED.waybills.vehiclePlate = "AAC-0123")

Step 3 — carrier iteration (same as internal, loop over CARRIER_CASES):
  [identical to waybill-internal.spec.js test 1, steps 3]

Step 4 — delivery information (no destinationSubsidiary for external):
  fillAddressDetails(page, {
    address: SEED.waybills.address = "Dir 1"
    reason:  SEED.waybills.reason  = "razon 1"
    route:   SEED.waybills.route   = "ruta 1"
    [no destinationSubsidiary]
  })

Step 5 — shipment product (from sale, not free search):
  selectFirstAvailableShipmentProductFromSale(page)
  └─ clicks .v-autocomplete (last on page) field
  └─ clicks first dropdown option
  └─ throws if dropdown is empty (no remaining quantity on the sale)

Step 6 — quantity:
  fillShipmentAmount(SEED.waybills.shipmentAmountExternal = "1")

Step 7 — submit:
  submitWaybillAndVerify(page, { tenantBaseUrl })
  └─ wait POST /api/v2/billing/waybills → 201
  └─ snackbar "Proceso realizado correctamente"
  └─ assert URL /admin/waybills/list
```

---

**Test 2 — "creates a sale and an external waybill with a long product name"**

This test is self-contained: it creates its own sale to guarantee the long-name product is available.

```
Step 1 — create sale (so the long-name product appears in the "Ventas Electrónicas Autorizadas" modal):
  runAdminSaleFlow(page, {
    tenantBaseUrl,
    authType,
    documentType: SEED.documentTypes.facturaElectronica
    clientCedula: SEED.clients.test.cedula = "0000000001"
    productName:  SEED.products.estandarLargo.name
  })
  └─ wait POST /api/v2/billing/sales → 200
  └─ snackbar "Venta guardada"

Step 2 — fill external waybill form (picks saleIndex: 0 = the freshly created sale):
  fillExternalWaybillForm(page, {
    tenantBaseUrl,
    checkoutName: SEED.pos.checkout
    saleIndex: 0
  })

Step 3 — vehicle plate and carrier:
  fillVehiclePlate(SEED.waybills.vehiclePlate)
  assignCarrier(page, "cedula")

Step 4 — delivery information:
  fillAddressDetails(page, {
    address: SEED.waybills.address
    reason:  SEED.waybills.reason
    route:   SEED.waybills.route
  })

Step 5 — long-name product from sale:
  selectFirstAvailableShipmentProductFromSale(page)

Step 6 — quantity:
  fillShipmentAmount(SEED.waybills.shipmentAmountExternal = "1")

Step 7 — submit:
  submitWaybillAndVerify(page, { tenantBaseUrl })
```

**Endpoints exercised:**
- `POST /api/v2/billing/sales → 200` (test 2 pre-step only)
- `POST /api/v2/billing/waybills → 201` (both tests)

---

## Seed data summary

All constants come from `e2e/Wanqara/harness/seed.js` unless noted.

| Constant | Value | Used by |
|---|---|---|
| `SEED.products.estandar.name` | `"Caja de alitas de pollo (100 u)"` | All sale specs, waybill-internal test 1 |
| `SEED.products.estandarLargo.name` | `"Alitas de Pollo Crispy..."` (195 chars) | waybill-internal test 2, waybill-external test 2 |
| `SEED.products.estandarLargo.code` | `"Ali000000002"` | waybill specs |
| `SEED.products.serie.name` | `"series test"` | dispatch specs |
| `SEED.products.tallaColor.name` | `"test talla color"` | dispatch specs |
| `SEED.clients.consumidorFinal.cedula` | `"0000000001"` | All sale and pre-sale specs |
| `SEED.clients.test.cedula` | `"0000000001"` | waybill-external test 2 |
| `SEED.clients.carrier.cedula` | `"1000000001"` | Both waybill specs |
| `SEED.clients.carrier.identity` | `"1000000001"` | Both waybill specs |
| `SEED.clients.carrier.identityType` | `"CEDULA"` | Both waybill specs |
| `SEED.clients.carrier.name` | `"Empleado Test 1"` | Both waybill specs |
| `SEED.documentTypes.facturaElectronica` | `"Factura electrónica"` | Document specs, waybill-external test 2 |
| `SEED.documentTypes.recibos` | `"Recibos"` | Document specs |
| `SEED.pos.checkout` | `"Caja 020 - 020"` | All sale and waybill specs |
| `SEED.pos.warehouse` | `"Bodega de Ventas W001"` | waybill-internal, sale-flow fallback |
| `SEED.discount.rate` | `"3.3337373372323"` | Modifier specs |
| `SEED.surcharge.rate` | `"3.3337373372323"` | Modifier specs |
| `SEED.waybills.vehiclePlate` | `"AAC-0123"` | Both waybill specs |
| `SEED.waybills.address` | `"Dir 1"` | Both waybill specs |
| `SEED.waybills.reason` | `"razon 1"` | Both waybill specs |
| `SEED.waybills.route` | `"ruta 1"` | Both waybill specs |
| `SEED.waybills.destinationSubsidiary` | `"002 - Wanqara Retail Dispatch"` | waybill-internal only |
| `SEED.waybills.shipmentAmountExternal` | `"1"` | waybill-external |
| `SEED.waybills.shipmentAmountInternal` | `"1.23233356728372"` | waybill-internal |

---

## Spec summary

| # | File | Sub-folder | authType(s) | Serial | Tests | Endpoints |
|---|---|---|---|---|---|---|
| 1 | `admin-sale-documents.spec.js` | `sales/` | `retail` × 2 | No | 2 | `POST /api/v2/billing/sales` |
| 2 | `admin-sale-dispatch.spec.js` | `sales/` | `dispatch` + `retail` | No | 2 | `POST /api/v2/billing/sales` |
| 3 | `admin-sale-modifiers.spec.js` | `sales/` | `retail` + `dispatch` | No | 4 | `POST /api/v2/billing/sales` |
| 4 | `admin-pre-sale-documents.spec.js` | `sales/pre-sale/` | `retail` × 2 | No | 2 | `POST /api/v2/billing/pre-sales` |
| 5 | `admin-pre-sale-dispatch.spec.js` | `sales/pre-sale/` | `dispatch` + `retail` | No | 2 | `POST /api/v2/billing/pre-sales` |
| 6 | `waybill-internal.spec.js` | `other-documents/waybills/` | `retail` | **Yes** | 2 | `POST /api/v2/billing/waybills` |
| 7 | `waybill-external.spec.js` | `other-documents/waybills/` | `retail` | **Yes** | 2 | `POST /api/v2/billing/sales` + `POST /api/v2/billing/waybills` |

---

## Known issues and failure modes

| Spec | Condition | Failure mode |
|---|---|---|
| `waybill-external.spec.js` test 1 | No authorized electronic sales exist in the tenant | `selectSaleFromModal` clicks an empty modal — `row.click()` fails with element not found |
| `waybill-external.spec.js` test 1 | The first available sale has no remaining shipment quantity | `selectFirstAvailableShipmentProductFromSale` throws `"The selected sale has no remaining quantity available for shipment."` |
| `waybill-external.spec.js` test 2 | The sale created in step 1 is not at `saleIndex: 0` (another sale exists at position 0) | The waybill links to the wrong sale; long-product assertion may still pass silently but the test validates wrong data |
| `admin-sale-dispatch.spec.js` | `dispatch` subsidiary is configured as retail (no dispatch) | `selectFirstSerie` is not called for `dispatch` group; if the series modal appears unexpectedly, the test hangs |
| All sale/pre-sale specs | `PLAYWRIGHT_TENANT_RUC` or credentials not configured | `requirePosCredentials(test)` skips the test with message `"Requires PLAYWRIGHT_TENANT_RUC and all specific user credentials"` |
| Both waybill specs | Carrier employee `"Empleado Test 1"` (cedula `1000000001`) does not exist in tenant | `verifyAndSaveCarrierModal` fails asserting name input — the lookup returns no record |
| `admin-pre-sale-dispatch.spec.js` | TallaColor product has no variants configured | `selectFirstVariant` times out waiting for "Variantes encontradas" modal |