# Regression — Inventory Reference

**Specs location:** `e2e/Wanqara/regression/inventory/products-services/`
**Playwright project:** `Admin-Inventory`
**Test match pattern:** `/Wanqara/regression/(inventory|transactions|settings)/.*\.spec\.js/`
**Tag:** `@regression`
**Auth identity used:** `retail` (`retail-session.json`, Wanqara Comercios 100)
**Run command:** `npx playwright test --project=Admin-Inventory`

---

## Folder structure

```
regression/inventory/
└── products-services/
    ├── brands.spec.js
    ├── colors.spec.js
    ├── discount.spec.js
    ├── recipe-decimals-validation.spec.js
    ├── sizes.spec.js
    └── surcharges.spec.js
    └── harness/
        ├── discount-flow.js
        └── recipe-helpers.js
```

---

## Global infrastructure consumed by these specs

All specs in this domain import from the shared harness at `e2e/Wanqara/harness/`. The two most critical utilities are:

### `crud-helpers.js` — `ensureCleanRecord`

Used by `brands`, `colors`, `sizes`, and `surcharges`. The function encapsulates the full create-verify-delete cycle in a single call:

```
ensureCleanRecord(page, {
  listPath,     ← URL of the record list (goto before cleanup)
  addPath,      ← URL of the add form (goto before create)
  name,         ← text to search for and verify in the list
  fillForm,     ← async (page) => { ... } fills the form fields
  endpointPattern,    ← substring matched against the API URL
  successMessage,     ← optional snackbar text after create
  confirmButtonRegex, ← regex matched against the delete confirmation button
  deleteSuccessMessage ← optional snackbar text after delete
})
```

**Internal flow:**

```
1. page.goto(listPath)
2. deleteRecordFromList({ searchName: name, endpointPattern, confirmButtonRegex, successMessage: deleteSuccessMessage })
   └─ searchInList(page, name) → fill search textbox
   └─ if matching row visible:
       └─ open speed-dial or locate delete button
       └─ click delete → confirm dialog → wait DELETE endpointPattern → 200
       └─ optional: assert deleteSuccessMessage snackbar
3. page.goto(addPath)
4. fillForm(page)                   ← caller-supplied
5. saveFormAndVerify({ endpointPattern, successMessage })
   └─ click "Guardar" button
   └─ wait POST endpointPattern → 200 or 201
   └─ assert successMessage snackbar (or any snackbar if omitted)
6. page.goto(listPath)
7. verifyRecordInList({ searchName: name })
   └─ searchInList → assert matching row visible
```

### `auth.js` — `ensureAuthenticated`

`recipe-decimals-validation.spec.js` calls this explicitly because it uses `test.describe.serial` and manages its own navigation rather than relying on a fixture. See the global harness reference for the full session-repair logic.

---

## Domain-level harness — `products-services/harness/`

### `discount-flow.js`

All exports are used exclusively by `discount.spec.js`.

| Export | Purpose |
|---|---|
| `fillDiscountForm(page, opts)` | Navigates to `/admin/discounts/add`, fills name, description, application method (dropdown), discount type (dropdown), discount value, optional quantity, start date (today), end date (today), and clicks "Seleccionar todos" to apply to all products. |
| `saveDiscount(page)` | Calls `saveFormAndVerify` with `endpointPattern: "/api/v1/inventory/discounts"` and `successMessage: "Descuento creado exitosamente"`. |
| `verifyDiscountInList(page, { tenantBaseUrl, name })` | Navigates to `/admin/discounts/list` and calls `verifyRecordInList`. |
| `assertDiscountSummary(page, { applicationMethod, type, discount, quantity })` | Asserts the "Resumen de Descuento" card shows the correct application method label (`Siempre`, `Por Cada`, `A partir de`), discount type label (`Porcentaje`, `Fijo`), discount value (as `10%` or `$1`), and quantity span when applicable. |
| `deleteDiscountIfExists(page, { tenantBaseUrl, name })` | Navigates to `/admin/discounts/list` and calls `deleteRecordFromList` with `confirmButtonRegex: /^Confirmar$/i`. Used as a pre-test cleanup step. |

**`fillDiscountForm` internals:**

```
page.goto(/admin/discounts/add)

fill "Nombre del descuento" input → name
fill #description → description (if provided)

application method dropdown:
  └─ locator: .v-field containing input[placeholder='Selecciona el método de aplicación']
  └─ options: "Siempre" (always), "Por Cada" (every_to), "A partir de" (from_to)

discount type dropdown:
  └─ locator: .v-field containing input[placeholder='Selecciona el tipo de descuento']
  └─ options: "Porcentaje", "Fijo"

fill "Valor del descuento" → discount value, press Tab

if applicationMethod !== "always":
  fill "Cantidad cuando se aplica" → quantity, press Tab

start date: click "Fecha de Inicio" textbox → click "Hoy" button
end date:   click "Fecha de Fin" textbox   → click "Hoy" button

click span "Seleccionar todos"   ← applies discount to all product types
```

### `recipe-helpers.js`

Single export used exclusively by `recipe-decimals-validation.spec.js`.

**`navigateToProductAndVerifyRecipeDecimals(page, { tenantBaseUrl, productName, ingredientName, exactAmount, roundedAmount })`**

Full flow:

```
page.goto(/admin/products/list?inventory_init=false)
waitURL /admin/products/list

fill search input (getByRole textbox "Busca lo que necesites") → productName
waitForTimeout 1000

locate .v-data-table__tr containing exact productName text → row
click last button in actionsCell (speed-dial trigger)
waitForTimeout 500

for each button.v-btn in actionsCell:
  hover button
  check .v-overlay__content tooltip "Ver este Producto" (800ms timeout)
  if visible: click button → break

assert: tooltip click succeeded (throws if not found)

locate .tw-w-32.tw-flex.tw-flex-col containing ingredientName → ingredientContainer
assert ingredientContainer contains roundedAmount    ← UI shows 2-decimal rounded value
assert ingredientContainer does NOT contain exactAmount ← full precision not shown in card

hover span.tw-truncate inside ingredientContainer (scroll into view first)
locate .v-overlay__content tooltip containing ingredientName → tooltipContent
assert tooltipContent visible (5000ms)
assert tooltipContent contains exactAmount    ← full precision shown in tooltip

move mouse to (0,0)
assert tooltipContent not visible
```

**Why tooltip discovery works this way:** The product list uses a speed-dial action pattern where hovering over each button reveals a tooltip via `.v-overlay__content`. The helper iterates all buttons in the row and hover-tests each one until it finds the tooltip matching "Ver este Producto". Disabled buttons are skipped. This is the same tooltip-based button discovery pattern used in `crud-helpers.js::clickTableRowAction`.

---

## Specs

### 1. `brands.spec.js`

**What it tests:** Create–verify–delete lifecycle for an inventory brand record.

**authType:** `retail` (via `Admin-Inventory` project's shared `storageState`)

**Test structure:** Single test, not serial.

**`setTimeout`:** Default (45 000 ms local / 120 000 ms CI)

**Seed data used:**

| Constant | Value |
|---|---|
| `SEED.attributes.brand.name` | `"Marca Test Automatizado"` |
| `SEED.attributes.brand.order` | `"1"` |
| `SEED.attributes.brand.observation` | `"test"` |

**Flow:**

```
ensureCleanRecord(page, {
  listPath:  /admin/brands/list
  addPath:   /admin/brands/add
  name:      "Marca Test Automatizado"
  fillForm:
    └─ fill "Nombre de la Marca"    → SEED.attributes.brand.name
    └─ fill "Orden de la Marca"     → SEED.attributes.brand.order
    └─ fill "Observaciones"         → SEED.attributes.brand.observation
  endpointPattern:    "/api/v1/inventory/brands"
  confirmButtonRegex: /^Aceptar$/i
})
```

**Endpoint exercised:** `POST /api/v1/inventory/brands → 200 or 201`

**Note:** No `successMessage` or `deleteSuccessMessage` is passed — the snackbar check falls back to asserting any `.v-snackbar` is visible. The delete confirmation button is "Aceptar".

---

### 2. `colors.spec.js`

**What it tests:** Create–verify–delete lifecycle for a color record, including interaction with the Vuetify color swatch picker.

**authType:** `retail`

**Test structure:** Single test, not serial.

**`setTimeout`:** Default

**Seed data used:**

| Constant | Value |
|---|---|
| `SEED.attributes.color.name` | `"Color Test Automatizado"` |
| `SEED.attributes.color.observation` | `"Observación de prueba automatizada"` |

**Flow:**

```
ensureCleanRecord(page, {
  listPath:  /admin/colors/list
  addPath:   /admin/colors/add
  name:      "Color Test Automatizado"
  fillForm:
    └─ fill getByRole textbox "Nombre del color"      → SEED.attributes.color.name
    └─ fill getByRole textbox "Observación del color" → SEED.attributes.color.observation
    └─ locate .v-color-picker-swatches__color > div (first)
    └─ assert visible → click (selects first available color swatch)
  endpointPattern:      "/api/v1/general/colors"
  successMessage:       "Color Creado"
  deleteSuccessMessage: "Color Eliminado"
  confirmButtonRegex:   /^Aceptar$/i
})
```

**Endpoint exercised:** `POST /api/v1/general/colors → 200 or 201`

**Note:** The color swatch is a `.v-color-picker-swatches__color > div` element. The test clicks the first visible swatch — the specific color selected does not matter for the test assertion.

---

### 3. `discount.spec.js`

**What it tests:** Three discount configuration combinations covering the Cartesian product of `applicationMethod × discountType`. The first test also exercises the full create-and-list verification cycle. The second and third test only verify the summary preview panel without saving.

**authType:** `retail`

**Test structure:** Three independent tests (not serial). The first test includes a pre-test cleanup step.

**`setTimeout`:** 120 000 ms (all three tests)

**Seed data used:**

| Constant | Value |
|---|---|
| `SEED.discount.crud.alwaysPercentage.name` | `"Descuento Siempre Porcentaje"` |
| `SEED.discount.crud.alwaysPercentage.description` | `"test automatizado"` |
| `SEED.discount.crud.alwaysPercentage.discount` | `10` |
| `SEED.discount.crud.everyFixed.name` | `"Descuento Por Cada Fijo"` |
| `SEED.discount.crud.everyFixed.description` | `"test automatizado"` |
| `SEED.discount.crud.everyFixed.discount` | `1` |
| `SEED.discount.crud.everyFixed.quantity` | `10` |
| `SEED.discount.crud.fromPercentage.name` | `"Descuento A Partir De Porcentaje"` |
| `SEED.discount.crud.fromPercentage.description` | `"test automatizado"` |
| `SEED.discount.crud.fromPercentage.discount` | `5` |
| `SEED.discount.crud.fromPercentage.quantity` | `3` |

---

**Test 1 — "verifies discount summary for 'Siempre' + 'Porcentaje' and creates the discount"**

Steps:

```
Step 1 — pre-cleanup:
  deleteDiscountIfExists(page, { tenantBaseUrl, name: "Descuento Siempre Porcentaje" })
  └─ page.goto(/admin/discounts/list)
  └─ deleteRecordFromList(searchName, confirmButtonRegex: /^Confirmar$/i)

Step 2 — fill form:
  fillDiscountForm(page, {
    tenantBaseUrl,
    name:              "Descuento Siempre Porcentaje"
    description:       "test automatizado"
    applicationMethod: "always"
    type:              "porcentaje"
    discount:          10
  })

Step 3 — verify summary panel:
  assertDiscountSummary(page, {
    applicationMethod: "always"
    type:              "porcentaje"
    discount:          10
  })
  └─ assert card "Resumen de Descuento" visible
  └─ assert strong "Siempre" visible
  └─ assert strong "Porcentaje" visible
  └─ assert span "10%" visible

Step 4 — save:
  saveDiscount(page)
  └─ wait POST /api/v1/inventory/discounts → 200 or 201
  └─ snackbar "Descuento creado exitosamente"

Step 5 — verify in list:
  verifyDiscountInList(page, { tenantBaseUrl, name: "Descuento Siempre Porcentaje" })
  └─ page.goto(/admin/discounts/list)
  └─ searchInList → assert row visible
```

---

**Test 2 — "verifies discount summary for 'Por Cada' + 'Fijo'"**

No cleanup, no save, no list verification. Summary panel only.

```
fillDiscountForm(page, {
  applicationMethod: "every_to"
  type:              "fijo"
  discount:          1
  quantity:          10
})

assertDiscountSummary(page, {
  applicationMethod: "every_to"
  type:              "fijo"
  discount:          1
  quantity:          10
})
└─ assert strong "Por Cada" visible
└─ assert span "10" visible      ← quantity
└─ assert strong "Fijo" visible
└─ assert span "$1" visible      ← discount value
```

---

**Test 3 — "verifies discount summary for 'A partir de' + 'Porcentaje'"**

No cleanup, no save, no list verification. Summary panel only.

```
fillDiscountForm(page, {
  applicationMethod: "from_to"
  type:              "porcentaje"
  discount:          5
  quantity:          3
})

assertDiscountSummary(page, {
  applicationMethod: "from_to"
  type:              "porcentaje"
  discount:          5
  quantity:          3
})
└─ assert strong "A partir de" visible
└─ assert span "3" visible       ← quantity
└─ assert strong "Porcentaje" visible
└─ assert span "5%" visible
```

**Endpoints exercised:**
- `POST /api/v1/inventory/discounts → 200 or 201` (test 1 only, via `saveDiscount`)
- `DELETE /api/v1/inventory/discounts/{id} → 200` (test 1 pre-cleanup, if record exists)

---

### 4. `recipe-decimals-validation.spec.js`

**What it tests:** That the product detail view rounds recipe ingredient amounts to 2 decimal places in the visible UI card, while preserving and displaying the full-precision exact amount in the hover tooltip. Validates two product types: `elaborado` and `preElaborado`.

**authType:** `retail` — specified explicitly via `test.use({ storageState: getSessionPath("retail") })` inside the describe block. This overrides any project-level storageState.

**Test structure:** `test.describe.serial` — 2 tests that share no state between them but must not run in parallel because both call `ensureAuthenticated` and navigate to the same product list.

**`setTimeout`:** 120 000 ms (both tests)

**Seed data used:**

| Constant | Value |
|---|---|
| `SEED.recipeDecimals.elaborado.productName` | `"Porción de Alitas Marinadas - ToolTip"` |
| `SEED.recipeDecimals.elaborado.ingredientName` | `"Bowl de Alitas Marinadas (20 u)"` |
| `SEED.recipeDecimals.elaborado.exactAmount` | `"0.74626865671642"` |
| `SEED.recipeDecimals.elaborado.roundedAmount` | `"0.75"` |
| `SEED.recipeDecimals.preElaborado.productName` | `"Bowl de Alitas Marinadas (20 u) - ToolTip"` |
| `SEED.recipeDecimals.preElaborado.ingredientName` | `"Alita Individual"` |
| `SEED.recipeDecimals.preElaborado.exactAmount` | `"0.30000300003"` |
| `SEED.recipeDecimals.preElaborado.roundedAmount` | `"0.3"` |

**Precondition:** The two ToolTip-suffixed products (`"Porción de Alitas Marinadas - ToolTip"` and `"Bowl de Alitas Marinadas (20 u) - ToolTip"`) must exist in the tenant's product catalog with recipe ingredients configured at the exact decimal amounts specified above.

**Flow (both tests follow the same pattern via `navigateToProductAndVerifyRecipeDecimals`):**

```
ensureAuthenticated(page, {
  tenantBaseUrl,
  targetPath: "/admin/products/list",
  authType: "retail"
})

page.goto(/admin/products/list?inventory_init=false)
waitURL /admin/products/list

fill search input → productName
waitForTimeout 1000

locate row containing exact productName text
click speed-dial trigger (last button/element in actionsCell)
waitForTimeout 500

for each button.v-btn in actionsCell (hover-discover pattern):
  if button disabled → skip
  hover button
  wait for .v-overlay__content tooltip "Ver este Producto" (800ms)
  if found → click button, break
  if not found → continue

locate .tw-w-32.tw-flex.tw-flex-col containing ingredientName → ingredientContainer
assert ingredientContainer contains roundedAmount
assert ingredientContainer does NOT contain exactAmount

hover span.tw-truncate inside ingredientContainer (scroll into view first)
locate .v-overlay__content tooltip containing ingredientName → tooltipContent
assert tooltipContent visible (5000ms timeout)
assert tooltipContent contains exactAmount

move mouse to (0, 0)
assert tooltipContent not visible
```

**Test 1 — "Validates elaborated product shows 2 decimals in UI and exact amount in tooltip"**

- Product: `"Porción de Alitas Marinadas - ToolTip"` (elaborado type)
- Ingredient: `"Bowl de Alitas Marinadas (20 u)"`
- UI card shows: `"0.75"` (2 decimals)
- Tooltip shows: `"0.74626865671642"` (full precision)

**Test 2 — "Validates pre-elaborated product shows 2 decimals in UI and exact amount in tooltip"**

- Product: `"Bowl de Alitas Marinadas (20 u) - ToolTip"` (preElaborado type)
- Ingredient: `"Alita Individual"`
- UI card shows: `"0.3"` (rounded)
- Tooltip shows: `"0.30000300003"` (full precision)

**Note on test naming convention:** The `-  ToolTip` suffix in the product names is intentional — these are distinct product records from the regular `elaborado`/`preElaborado` products used elsewhere in the suite. They exist solely for this spec to avoid polluting the recipe-precision display of production-style products.

**Endpoints exercised:** None (read-only navigation; no API mutations).

---

### 5. `sizes.spec.js`

**What it tests:** Create–verify–delete lifecycle for a size record.

**Status: SKIPPED — active `test.fixme`**

This spec is permanently skipped due to a known bug tracked at Jira issue [WS-941](https://wanqara-team.atlassian.net/browse/WS-941).

**Fixme message:** `"Bypass temporal (WS-941): Bug en validación, ahora cualquier nombre indica que ya está en uso y bloquea la creación."`

**What the test would do (when re-enabled):**

```
ensureCleanRecord(page, {
  listPath:  /admin/sizes/list
  addPath:   /admin/sizes/add
  name:      "Talla Test Automatizado"
  fillForm:
    └─ fill getByRole textbox "Nombre de la Talla"         → SEED.attributes.size.name
    └─ fill getByRole textbox "Observación de la talla"    → SEED.attributes.size.observation
  endpointPattern:      "/api/v1/general/sizes"
  successMessage:       "Talla Creada"
  deleteSuccessMessage: "Talla Eliminada"
  confirmButtonRegex:   /^Aceptar$/i
})
```

**Seed data that would be used:**

| Constant | Value |
|---|---|
| `SEED.attributes.size.name` | `"Talla Test Automatizado"` |
| `SEED.attributes.size.observation` | `"Observación de prueba automatizada"` |

**Action required to re-enable:** Remove the `test.fixme(true, ...)` call once WS-941 is resolved. No other changes to the spec are needed.

---

### 6. `surcharges.spec.js`

**What it tests:** Create–verify–delete lifecycle for a manual surcharge record.

**authType:** `retail`

**Test structure:** Single test, not serial.

**`setTimeout`:** Default

**Seed data used:**

| Constant | Value |
|---|---|
| `SEED.surcharge.crud.name` | `"Recargo Test Automatizado"` |
| `SEED.surcharge.crud.percentage` | `"10"` |

**Flow:**

```
ensureCleanRecord(page, {
  listPath:  /admin/surcharges/list
  addPath:   /admin/surcharges/add
  name:      "Recargo Test Automatizado"
  fillForm:
    └─ fill getByRole textbox "Nombre del recargo" → SEED.surcharge.crud.name
    └─ fill getByPlaceholder "Porcentaje del recargo" → SEED.surcharge.crud.percentage
    └─ press Tab (triggers validation)
  endpointPattern:    "/api/v1/general/surcharges"
  confirmButtonRegex: /^Confirmar$/i
})
```

**Endpoint exercised:** `POST /api/v1/general/surcharges → 200 or 201`

**Note:** No `successMessage` or `deleteSuccessMessage` is passed. The delete confirmation button is "Confirmar" (not "Aceptar" as in brands/colors). The `Tab` keypress after the percentage value is required to trigger blur-based validation before the save button becomes enabled.

---

## Seed data summary

All constants come from `e2e/Wanqara/harness/seed.js`.

| Constant | Value | Used by |
|---|---|---|
| `SEED.attributes.brand.name` | `"Marca Test Automatizado"` | `brands.spec.js` |
| `SEED.attributes.brand.order` | `"1"` | `brands.spec.js` |
| `SEED.attributes.brand.observation` | `"test"` | `brands.spec.js` |
| `SEED.attributes.color.name` | `"Color Test Automatizado"` | `colors.spec.js` |
| `SEED.attributes.color.observation` | `"Observación de prueba automatizada"` | `colors.spec.js` |
| `SEED.attributes.size.name` | `"Talla Test Automatizado"` | `sizes.spec.js` (skipped) |
| `SEED.attributes.size.observation` | `"Observación de prueba automatizada"` | `sizes.spec.js` (skipped) |
| `SEED.discount.crud.alwaysPercentage` | `{ name, description, discount: 10 }` | `discount.spec.js` |
| `SEED.discount.crud.everyFixed` | `{ name, description, discount: 1, quantity: 10 }` | `discount.spec.js` |
| `SEED.discount.crud.fromPercentage` | `{ name, description, discount: 5, quantity: 3 }` | `discount.spec.js` |
| `SEED.surcharge.crud.name` | `"Recargo Test Automatizado"` | `surcharges.spec.js` |
| `SEED.surcharge.crud.percentage` | `"10"` | `surcharges.spec.js` |
| `SEED.recipeDecimals.elaborado.productName` | `"Porción de Alitas Marinadas - ToolTip"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.elaborado.ingredientName` | `"Bowl de Alitas Marinadas (20 u)"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.elaborado.exactAmount` | `"0.74626865671642"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.elaborado.roundedAmount` | `"0.75"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.preElaborado.productName` | `"Bowl de Alitas Marinadas (20 u) - ToolTip"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.preElaborado.ingredientName` | `"Alita Individual"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.preElaborado.exactAmount` | `"0.30000300003"` | `recipe-decimals-validation.spec.js` |
| `SEED.recipeDecimals.preElaborado.roundedAmount` | `"0.3"` | `recipe-decimals-validation.spec.js` |

---

## Spec summary

| # | File | Serial | Active | Tests | Endpoints exercised |
|---|---|---|---|---|---|
| 1 | `brands.spec.js` | No | Yes | 1 | `POST /api/v1/inventory/brands` |
| 2 | `colors.spec.js` | No | Yes | 1 | `POST /api/v1/general/colors` |
| 3 | `discount.spec.js` | No | Yes | 3 | `POST /api/v1/inventory/discounts` (test 1 only) |
| 4 | `recipe-decimals-validation.spec.js` | **Yes** | Yes | 2 | None (read-only) |
| 5 | `sizes.spec.js` | No | **Skipped (WS-941)** | 1 | `POST /api/v1/general/sizes` (when re-enabled) |
| 6 | `surcharges.spec.js` | No | Yes | 1 | `POST /api/v1/general/surcharges` |

---

## Known issues and failure modes

| Spec | Condition | Failure mode |
|---|---|---|
| `recipe-decimals-validation.spec.js` | ToolTip products do not exist in tenant | Test fails at `expect(row).toBeVisible()` — the search returns no results |
| `recipe-decimals-validation.spec.js` | Ingredient amounts differ from seed values | Assertion `toContainText(roundedAmount)` or `toContainText(exactAmount)` fails |
| `recipe-decimals-validation.spec.js` | Speed-dial hover-discovery finds no "Ver este Producto" button | Throws `"No se encontró el botón con el tooltip 'Ver este Producto'."` |
| `discount.spec.js` | "Descuento Siempre Porcentaje" exists from a prior partial run | Pre-cleanup handles this; if the API delete returns non-200 the cleanup snackbar assertion may fail |
| `brands.spec.js` / `colors.spec.js` / `surcharges.spec.js` | Record exists from prior run | `ensureCleanRecord` deletes it in step 1 before re-creating; idempotent by design |
| `sizes.spec.js` | WS-941 regression is shipped | `test.fixme` prevents execution; test is reported as skipped, not failed |