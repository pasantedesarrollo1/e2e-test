# Regression — Settings Reference

**Specs location:** `e2e/Wanqara/regression/settings/`
**Playwright project:** `Admin-Inventory`
**Test match pattern:** `/Wanqara/regression/(inventory|transactions|settings)/.*\.spec\.js/`
**Tag:** `@regression`
**Run command:** `npx playwright test --project=Admin-Inventory`

---

## Folder structure

```
regression/settings/
└── configuration/
    ├── generals/
    │   ├── harness/
    │   │   └── subscriptions-flow.js
    │   └── subscriptions-overview.spec.js
    ├── my-tickets/
    │   └── support-tickets.spec.js
    ├── surcharges/
    │   └── subsidiaries-crud.spec.js
    └── warehouses/
        └── warehouses-crud.spec.js
```

**Folder naming caveat:** `subsidiaries-crud.spec.js` lives under `surcharges/`. The folder name does not reflect the spec content, which exercises subsidiary CRUD, not surcharge configuration. Navigate by file name, not folder semantics.

---

## Auth identities used

All Settings specs run under the `retail` identity.

| Identity | `storageState` file | How applied |
|---|---|---|
| `retail` | `retail-session.json` | Project-level default for `Admin-Inventory`; `subscriptions-overview.spec.js` also sets it explicitly via `test.use` |

`subscriptions-overview.spec.js` calls `ensureAuthenticated` per test to guard against session expiry mid-run. `support-tickets.spec.js` calls `ensureAuthenticated` inside `navigateToCreateTicket`. `subsidiaries-crud.spec.js` and `warehouses-crud.spec.js` rely on the project-level storageState without an explicit per-test auth call — both use `requirePosCredentials(test)` only as a skip guard, not as an auth mechanism.

---

## Shared infrastructure — `generals/harness/`

### `subscriptions-flow.js`

Domain-specific harness used exclusively by `subscriptions-overview.spec.js`. Imports `SEED_SUBSCRIPTIONS` from `e2e/Wanqara/harness/seeds/subscriptions-seed.js`.

**`normalizeText(str)`** (internal, not exported): strips combining diacritical marks via `String.prototype.normalize("NFD")`, removes the resulting combining characters with `/[\u0300-\u036f]/g`, then trims and lowercases. Used throughout to compare Spanish UI text against seed constants in a locale-insensitive way — for example `"Módulo para uso de banner"` → `"modulo para uso de banner"`. All cross-seed comparisons in both exported functions pass through this normalization on both sides.

---

#### `validateSubscriptionsOverview(page)`

Three-step read-only validation function. Does not navigate — the caller must already be on `/admin/settings/subscriptions`. All steps are wrapped in `test.step` blocks internally.

**Step 1 — page load gate:**
Waits for `span.tw-text-2xl` containing text `"Suscripciones"` to be visible with a 15 000 ms timeout.

**Step 2 — plan validation:**
Reads `.tw-bg-primary .tw-text-base.tw-font-semibold.tw-text-white`. Skips entirely if the element is not visible. If visible, extracts `textContent` and applies three guards before asserting:

- Skips if the text equals `"Sin plan"`.
- Skips if the text matches `/^\d{3}\s-/` (a subsidiary-code prefix pattern, indicating the selector resolved to the wrong element).
- Otherwise normalizes the text and asserts it exists in `SEED_SUBSCRIPTIONS.plans[].name` (normalized comparison). Failure message includes the unrecognized plan text.

**Step 3 — modules validation:**
Queries all `div.tw-min-w-0.tw-flex-1` containers that contain a `div.tw-text-xs:not(.tw-text-textSecondary)` child. For each container, reads the `div.tw-text-xs` text as a module code (trimmed, not normalized — codes are ASCII) and asserts it exists in `SEED_SUBSCRIPTIONS.modules[].code` with an exact match. Failure message includes the unrecognized code.

**Step 4 — receipt packs validation:**
Locates `span.tw-text-sm.tw-text-primary.tw-font-semibold` with text `"Paquetes de comprobantes"`. Skips entirely if not visible. If visible, reads its adjacent `+ div.tw-grid` sibling and iterates every `.v-chip` inside it. For each chip, normalizes the text and asserts at least one of the following is true:

- `normalizeText(chip text) === normalizeText(receipt.quantity)` for any entry in `SEED_SUBSCRIPTIONS.receipts`.
- `chip text === "-1"` AND `normalizeText(receipt.quantity) === "ilimitados"` for any entry in `SEED_SUBSCRIPTIONS.receipts` (handles the unlimited package rendering as `-1` in the UI instead of the seed's `"Ilimitados"`).

---

#### `validateSubsidiaryCapabilityBadges(page, tenantBaseUrl)`

Two-step read-only validation function. Navigates to the subsidiary creation form and validates the capability badges rendered there. All steps are wrapped in `test.step` blocks internally.

**Step 1 — navigation:**
Calls `page.goto(withPath(tenantBaseUrl, '/admin/subsidiaries/add'))`. Waits for text `"Agregar una Sucursal"` to be visible (timeout 15 000 ms).

**Step 2 — badge validation:**
Queries all `span.tw-bg-primary.tw-text-white.tw-rounded-br-md.tw-rounded-tl-md` elements. Waits for the first to be visible (timeout 10 000 ms). For each badge, reads `textContent`, normalizes it, and asserts at least one of the following is true:

- The normalized badge text matches `normalizeText(module.name)` for any entry in `SEED_SUBSCRIPTIONS.modules`.
- The normalized badge text matches `normalizeText(label)` for any entry in `SEED_SUBSCRIPTIONS.capabilityLabels`.

Failure message identifies the exact badge text that did not match either list.

---

## Global harness used by Settings specs

The following helper from `e2e/Wanqara/harness/crud-helpers.js` is called directly by `subsidiaries-crud.spec.js` and `warehouses-crud.spec.js`:

| Helper | Used by | Purpose |
|---|---|---|
| `deleteRecordFromList(page, opts)` | Both CRUD specs | Fills the list search field with `opts.searchName`, locates the matching `.v-data-table__tr`, clicks the delete action button, confirms the dialog matching `opts.confirmButtonRegex`, waits for `DELETE opts.endpointPattern → 200`, and asserts `opts.successMessage` in `.v-snackbar`. If no matching row is found, returns without error (idempotent). |

Both CRUD specs call `deleteRecordFromList` twice per test: once at the start as a pre-cleanup step and once at the end to verify the record was created and then tear it down.

---

## Specs

### 1. `subscriptions-overview.spec.js`

**Location:** `settings/configuration/generals/`
**authType:** `retail`
**Test structure:** 2 tests, not serial.
**`setTimeout`:** 120 000 ms (test 1), 60 000 ms (test 2)

**What it tests:** That the subscriptions UI renders only plans, modules, and receipt packs that are defined in the seed, and that the capability badges on the subsidiary creation form are all recognized by either the modules list or the capability labels list.

---

**Test 1 — "Validates that displayed subscription cards match the seed data":**

```
ensureAuthenticated → /admin/settings/subscriptions (authType: "retail")

validateSubscriptionsOverview(page):
  └─ assert span.tw-text-2xl "Suscripciones" visible (15 000 ms)
  └─ read .tw-bg-primary .tw-text-base.tw-font-semibold.tw-text-white
       └─ skip if element not visible
       └─ skip if text = "Sin plan" or matches /^\d{3}\s-/
       └─ else: normalize → assert in SEED_SUBSCRIPTIONS.plans[].name
  └─ for each div.tw-min-w-0.tw-flex-1 containing div.tw-text-xs:not(.tw-text-textSecondary):
       └─ read div.tw-text-xs as module code → assert in SEED_SUBSCRIPTIONS.modules[].code
  └─ if span "Paquetes de comprobantes" visible:
       └─ for each .v-chip in adjacent div.tw-grid:
            └─ normalize text → assert in SEED_SUBSCRIPTIONS.receipts[].quantity
            └─ special case: chip text "-1" matches seed quantity "Ilimitados"
```

**Test 2 — "Validates that capability badges in subsidiary form match the seed data":**

```
ensureAuthenticated → /admin/home (authType: "retail")

validateSubsidiaryCapabilityBadges(page, tenantBaseUrl):
  └─ page.goto /admin/subsidiaries/add
  └─ assert "Agregar una Sucursal" visible (15 000 ms)
  └─ query all span.tw-bg-primary.tw-text-white.tw-rounded-br-md.tw-rounded-tl-md badges
  └─ wait for first badge visible (10 000 ms)
  └─ for each badge:
       └─ normalize text
       └─ assert normalizedText ∈ SEED_SUBSCRIPTIONS.modules[].name (normalized)
            OR normalizedText ∈ SEED_SUBSCRIPTIONS.capabilityLabels[] (normalized)
```

**Endpoints exercised:** None — both tests are read-only assertions against rendered DOM content.

**Preconditions:**
- The tenant must have at least one active subscription and at least one module assigned. A tenant with zero modules assigned causes the module-validation loop to pass with zero iterations, which the test does not treat as an error.
- The subscription plan displayed must be in `SEED_SUBSCRIPTIONS.plans` (after normalization), or it must match one of the two skip guards, otherwise test 1 fails.
- The subsidiary creation form must render at least one capability badge; otherwise the `waitFor` on the first badge (10 000 ms) will time out.

---

### 2. `support-tickets.spec.js`

**Location:** `settings/configuration/my-tickets/`
**authType:** `retail`
**Test structure:** 1 test, not serial.
**`setTimeout`:** 120 000 ms

**What it tests:** The support ticket creation multi-step form — selecting a category, advancing to the service and scheduling step, selecting the first available service and time slot, filling contact and observation fields, and accepting terms. The test verifies the form reaches a submittable state. It intentionally does not click "Agendar" to avoid creating real support tickets in the system.

**Flow:**

```
navigateToCreateTicket(page, tenantBaseUrl):
  └─ ensureAuthenticated → /admin/support/tickets/list (authType: "retail")
  └─ click role="link" "Crear Ticket"
  └─ assert URL /admin/support/tickets/create

selectFirstCategory(page):
  └─ assert first .v-card visible (10 000 ms)
  └─ click first .v-card

clickSiguiente(page):
  └─ assert role="button" "Siguiente" enabled (10 000 ms)
  └─ click it

selectFirstService(page):
  └─ locate .v-field containing input[placeholder='Selecciona un servicio']
  └─ assert visible (10 000 ms)
  └─ click to open dropdown
  └─ assert .v-overlay--active .v-list-item first option visible (5 000 ms)
  └─ click first option
  └─ assert option not visible

selectFirstDateAndSlot(page):
  └─ click role="textbox" /Seleccionar fecha y horario/i
  └─ assert .v-dialog with /Selecciona la fecha y horario/i visible (5 000 ms)
  └─ click first enabled in-month day:
       selector: .v-date-picker-month__day:not(.v-date-picker-month__day--outside) button:not([disabled])
       waits with implicit 10 000 ms visibility timeout
  └─ click first time slot button matching /^\d{1,2}:\d{2}/ (10 000 ms)
  └─ assert dialog not visible (5 000 ms)

fillWhatsapp(page, "999999999"):
  └─ fill #whatsapp input

fillObservation(page, "test automatizado"):
  └─ fill #observation textarea

acceptTerms(page):
  └─ check role="checkbox" /Acepto los Términos y Condiciones/i
  └─ assert checked

checkFormFilledCorrectly(page):
  └─ assert role="button" "Agendar" enabled (5 000 ms)
  └─ [does NOT click — form is not submitted]
```

**Endpoints exercised:** None — the form is not submitted.

**Preconditions:**
- The tenant must have at least one support ticket category available on the creation form.
- The selected category must have at least one service in its dropdown.
- The calendar must have at least one enabled day (not disabled, not outside the current month) with at least one available time slot. If all slots for the current month are fully booked, `selectFirstDateAndSlot` will time out waiting for an enabled day or a time slot button.

---

### 3. `subsidiaries-crud.spec.js`

**Location:** `settings/configuration/surcharges/` (mismatched folder name — see note in Folder Structure)
**authType:** `retail` (project-level storageState, no explicit `test.use`)
**Test structure:** 3 tests generated via `for...of` loop over `SEED.subsidiaries.crud`, not serial. Each test is fully independent and follows the same three-step pattern.
**`setTimeout`:** default (45 000 ms local / 120 000 ms CI)

**What it tests:** Full CRUD lifecycle for each subsidiary type combination — pre-cleanup, creation with all required fields and type/dispatch toggles, list verification, and deletion. Covers three configurations:

| Test title | `isRestaurant` | `hasDispatch` | `name` | `code` |
|---|---|---|---|---|
| `Comercios (Sin Despacho)` | `false` | `false` | `Sucursal Comercios Test` | `901` |
| `Comercios (Con Despacho)` | `false` | `true` | `Sucursal Despacho Test` | `902` |
| `Restaurantes (Sin Despacho)` | `true` | `false` | `Sucursal Restaurante Test` | `903` |

**Three-step pattern per test:**

**Step 1 — pre-cleanup:**

```
page.goto /admin/subsidiaries/list
page.waitForLoadState('networkidle')
deleteRecordFromList(page, {
  searchName: name,
  endpointPattern: '/api/v1/general/subsidiaries/',
  confirmButtonRegex: /^Eliminar Sucursal$/i,
  successMessage: 'eliminada'
})
```

If no matching record exists, `deleteRecordFromList` exits without error (idempotent first run).

**Step 2 — creation:**

```
click role="link" "Nueva Sucursal"
assert text "Agregar una Sucursal" visible

fill placeholder "Nombre de la Sucursal" → name
fill placeholder "Nombre Comercial de la Sucursal" → name
fill placeholder "Código de la Sucursal" → code
fill placeholder "Dirección de la Sucursal" → "123 Automated Test Address"

click placeholder "Provincia" → select first getByRole("option")
wait for placeholder "Ciudad" to be enabled → click → select first getByRole("option")

fill placeholder "Teléfono" → "0999999999"
fill placeholder "Correo" → "test_sucursal@wanqara.com"

if isRestaurant:
  click div[style*='min-width: 90px'] matching /Restaurante/i
else:
  click div[style*='min-width: 90px'] matching /^Comercios$/i

if dispatch container visible (.v-switch inside div matching /^Despacho posterior/):
  read input[type='checkbox'] checked state
  if hasDispatch ≠ current state: click .v-switch to toggle

click role="button" "Guardar" (first)

confirmation modal .v-overlay--active with text "La configuracion de la" appears:
  └─ check the declaration checkbox inside modal (force: true)
  └─ wait for POST /api/v1/general/subsidiaries → 201 parallel with:
  └─ click role="button" "Confirmar y crear"
  └─ assert .v-snackbar with "Creada" visible
```

**Step 3 — list verification and teardown:**

```
page.goto /admin/subsidiaries/list
page.waitForLoadState('networkidle')
deleteRecordFromList(page, {
  searchName: name,
  endpointPattern: '/api/v1/general/subsidiaries/',
  confirmButtonRegex: /^Eliminar Sucursal$/i,
  successMessage: 'eliminada'
})
```

Step 3 implicitly validates that the record was created: `deleteRecordFromList` searches by name first; if the record were missing, it would silently return without performing a deletion — and the subsequent snackbar assertion would never be triggered, so the test would pass vacuously for the delete action. However, if creation failed without throwing (e.g. a silent 400 the spec did not wait for), step 3 would pass vacuously. The POST wait in step 2 is the primary guard.

**Endpoints exercised:**
- `POST /api/v1/general/subsidiaries → 201` (creation)
- `DELETE /api/v1/general/subsidiaries/{id} → 200` (deletion, via `deleteRecordFromList`)

**Preconditions:**
- The tenant must have at least one provincia with at least one ciudad in its dropdowns.
- Codes `901`, `902`, `903` must not be permanently assigned to non-test subsidiaries. Duplicate codes cause the POST to fail and the creation step to throw on the response wait.
- `waitForLoadState('networkidle')` assumes the list page has no long-polling or streaming activity. A page that never reaches network idle will hang until the test timeout.

---

### 4. `warehouses-crud.spec.js`

**Location:** `settings/configuration/warehouses/`
**authType:** `retail` (project-level storageState, no explicit `test.use`)
**Test structure:** 1 test, not serial.
**`setTimeout`:** default (45 000 ms local / 120 000 ms CI)

**What it tests:** Full CRUD lifecycle for a single warehouse — pre-cleanup, creation with all required fields, list verification, and deletion. Uses `SEED.warehouses.crud[0]` (the retail warehouse entry) only. The dispatch (`crud[1]`) and restaurant (`crud[2]`) entries in the seed array are not exercised by this spec.

**Seed values used:**

| Field | Value |
|---|---|
| `name` | `"Bodega Test Ret"` |
| `code` | `"1001"` |
| `address` | `"Automated Test Address Ret"` |
| `description` | `"Automated Test Desc Ret"` |

**Three-step pattern:**

**Step 1 — pre-cleanup:**

```
page.goto /admin/warehouses/list
page.waitForLoadState('networkidle')
deleteRecordFromList(page, {
  searchName: "Bodega Test Ret",
  endpointPattern: '/api/v1/general/warehouses',
  confirmButtonRegex: /^Eliminar$/i,
  successMessage: 'Bodega eliminada correctamente'
})
```

**Step 2 — creation:**

```
click role="link" "Agregar Bodega"
assert text "Creación de Bodega" visible

fill placeholder "Nombre de la Bodega" → "Bodega Test Ret"
fill placeholder "Código de la Bodega" → "1001"
fill placeholder "Dirección de la Bodega" → "Automated Test Address Ret"
fill placeholder "Descripción de la Bodega" → "Automated Test Desc Ret"

click role="button" "Guardar" (first)
wait for POST /api/v1/general/warehouses → 201 parallel with button click
assert .v-snackbar with "Bodega creada correctamente" visible
```

**Step 3 — list verification and teardown:**

```
page.goto /admin/warehouses/list
page.waitForLoadState('networkidle')
deleteRecordFromList(page, {
  searchName: "Bodega Test Ret",
  endpointPattern: '/api/v1/general/warehouses',
  confirmButtonRegex: /^Eliminar$/i,
  successMessage: 'Bodega eliminada correctamente'
})
```

**Endpoints exercised:**
- `POST /api/v1/general/warehouses → 201` (creation)
- `DELETE /api/v1/general/warehouses/{id} → 200` (deletion, via `deleteRecordFromList`)

**Preconditions:**
- Warehouse code `"1001"` must not be permanently assigned to a non-test warehouse. A duplicate code causes the POST to fail.
- The `retail` session must have warehouse creation permissions; the "Agregar Bodega" link is not rendered without them.
- Same `waitForLoadState('networkidle')` caveat as `subsidiaries-crud.spec.js`.

---

## Seed data used by Settings specs

| Source | Constant / Key | Value summary | Used by |
|---|---|---|---|
| `subscriptions-seed.js` | `SEED_SUBSCRIPTIONS.plans` | 7 plan objects (`code` + `name`) | `subscriptions-overview` test 1 |
| `subscriptions-seed.js` | `SEED_SUBSCRIPTIONS.modules` | 15 module objects (`code` + `name`) | `subscriptions-overview` tests 1 and 2 |
| `subscriptions-seed.js` | `SEED_SUBSCRIPTIONS.receipts` | 13 receipt pack objects (`code` + `quantity`) | `subscriptions-overview` test 1 |
| `subscriptions-seed.js` | `SEED_SUBSCRIPTIONS.capabilityLabels` | 7 label strings | `subscriptions-overview` test 2 |
| `harness/seed.js` | `SEED.subsidiaries.crud` | Array of 3 subsidiary type definitions | `subsidiaries-crud` |
| `harness/seed.js` | `SEED.warehouses.crud[0]` | Retail warehouse definition | `warehouses-crud` |

---

### `SEED_SUBSCRIPTIONS.plans`

| `code` | `name` |
|---|---|
| `AP001` | Todos los permisos |
| `F0001` | Gratuito |
| `L001` | Lite |
| `B001` | Básico |
| `P001` | Pyme |
| `P002` | MAX |
| `O001` | One (pyme limitado) |

---

### `SEED_SUBSCRIPTIONS.modules`

| `code` | `name` |
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

---

### `SEED_SUBSCRIPTIONS.capabilityLabels`

`"Maneja Restaurantes"`, `"Maneja Varios Negocios"`, `"Maneja Balanzas"`, `"Maneja Subsidios"`, `"Maneja Listado de Precios"`, `"Maneja Cotizaciones"`, `"Multibodegas"`.

---

### `SEED_SUBSCRIPTIONS.receipts`

| `code` | `quantity` in seed | UI chip text |
|---|---|---|
| `RA101` | `"10"` | `10` |
| `RA102` | `"25"` | `25` |
| `RA103` | `"50"` | `50` |
| `RA012` | `"100"` | `100` |
| `RA010` | `"500"` | `500` |
| `RA104` | `"600"` | `600` |
| `RA011` | `"1000"` | `1000` |
| `RA105` | `"1200"` | `1200` |
| `004` | `"5000"` | `5000` |
| `RA106` | `"10000"` | `10000` |
| `RA013` | `"20000"` | `20000` |
| `RA107` | `"50000"` | `50000` |
| `007` | `"Ilimitados"` | `Ilimitados` or `-1` |

The validation accepts both `"Ilimitados"` and `"-1"` as valid chip texts for the unlimited package. Direct normalized comparison covers the `"Ilimitados"` case; the special-case branch `(chipText === "-1" && normalizeText(r.quantity) === "ilimitados")` covers the `-1` rendering.

---

### `SEED.subsidiaries.crud`

| `type` | `name` | `code` | `isRestaurant` | `hasDispatch` |
|---|---|---|---|---|
| `Comercios (Sin Despacho)` | `Sucursal Comercios Test` | `901` | `false` | `false` |
| `Comercios (Con Despacho)` | `Sucursal Despacho Test` | `902` | `false` | `true` |
| `Restaurantes (Sin Despacho)` | `Sucursal Restaurante Test` | `903` | `true` | `false` |

Static fields applied to all entries: address `"123 Automated Test Address"`, phone `"0999999999"`, email `"test_sucursal@wanqara.com"`.

---

### `SEED.warehouses.crud[0]`

| Field | Value |
|---|---|
| `authType` | `"retail"` |
| `name` | `"Bodega Test Ret"` |
| `code` | `"1001"` |
| `address` | `"Automated Test Address Ret"` |
| `description` | `"Automated Test Desc Ret"` |

`crud[1]` (`"Bodega Test Dis"`, dispatch) and `crud[2]` (`"Bodega Test Res"`, restaurant) are defined in the seed but not exercised by any current Settings spec.

---

## Spec summary

| # | File | Sub-folder | Auth | Serial | Tests | `@regression` tag | Submits data |
|---|---|---|---|---|---|---|---|
| 1 | `subscriptions-overview.spec.js` | `generals/` | retail | No | 2 | **Yes** | No |
| 2 | `support-tickets.spec.js` | `my-tickets/` | retail | No | 1 | **Yes** | No |
| 3 | `subsidiaries-crud.spec.js` | `surcharges/` | retail | No | 3 | **No** | Yes (POST + DELETE) |
| 4 | `warehouses-crud.spec.js` | `warehouses/` | retail | No | 1 | **No** | Yes (POST + DELETE) |

**`@regression` tag gap:** `subsidiaries-crud.spec.js` and `warehouses-crud.spec.js` have no tag in their `test.describe` blocks — just the plain title string. They are picked up by the `Admin-Inventory` project pattern and run normally with `npx playwright test --project=Admin-Inventory`. However, adding `--grep @regression` to the run command will exclude them. Do not add a grep filter when running the full Settings regression suite.