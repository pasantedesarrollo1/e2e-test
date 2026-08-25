# Smoke Suite — Reference

**Location:** `e2e/Wanqara/smoke/route-health/`
**Playwright project:** `Smoke`
**Test match pattern:** `/Wanqara/smoke/.*\.spec\.js/`
**storageState:** `retail-session.json` (project-level default, never overridden per-spec)
**authType:** `retail` (single identity — all specs share the same session)
**Tag:** `@smoke`
**Run command:** `npx playwright test --project=Smoke`
**CI trigger:** push to `develop` + manual `workflow_dispatch`

---

## What this suite is

The smoke suite verifies that **admin and POS routes render without errors** after every deploy. Each test navigates to a URL and confirms that a key UI element is visible. There is no form interaction, no data creation or modification, and no business-logic assertions.

A smoke failure means a route returned a 500, redirected to `/error`, or the main component failed to load — a signal that the deploy broke something fundamental.

---

## Architecture — how the pattern works

The entire suite is built on two functions in `harness/`:

### `smoke-nav.js` — the test generator

```
smokeGo(page, tenantBaseUrl, path)
  └─ ensureAuthenticated(page, { tenantBaseUrl, targetPath: path })
       └─ page.goto(tenantBaseUrl + path)
       └─ session repair if redirected to /login
  └─ expect(page).not.toHaveURL(/\/error/)   ← the only mandatory assert

generateSmokeTests(tenantBaseUrl, routes)
  └─ for each { path, assert } in routes:
       test(`GET ${path}`, async ({ page }) => {
         await smokeGo(page, tenantBaseUrl, path)
         if (assert) await withSessionWatchdog(page, () => assert(page))
       })
```

`generateSmokeTests` produces one independent test per route. The test name is literally `GET /admin/the-route` — that is how it appears in the Playwright report and Telegram notifications.

### `smoke-assertions.js` — available assert functions

All use `timeout: 15000` except `assertProductCardsVisible` which uses `45000` (the POS home takes longer to load the product catalog).

| Function | What it checks | Locator |
|---|---|---|
| `assertPageTitle(page, title)` | Exact text in the Vuetify toolbar title | `.v-toolbar-title` with `hasText` |
| `assertAdminHomeWelcome(page)` | Fixed welcome text on the home screen | `getByText("Bienvenido ¡Tu crecimiento comienza aquí!")` |
| `assertProductCardsVisible(page)` | At least one product card visible | `.custom-card` (timeout 45 s) |
| `assertTableHasRows(page)` | At least one table row visible | `.v-data-table__tr` |
| `assertTextVisible(page, text)` | Exact text (trimmed) anywhere on the page | `getByText(/^\s*text\s*$/)` |
| `assertTextContains(page, text)` | Text present as a substring anywhere | `getByText(text, { exact: false })` |
| `assertMainContains(page, text)` | Text present as a substring inside `<main>` | `page.locator("main").getByText(text)` |
| `assertAnyTextVisible(page, texts[])` | Any one of several alternative texts | `getByText(regex with OR)` |

### Spec structure

Every spec follows this exact pattern — no exceptions:

```javascript
test.describe("Smoke — [Section]", { tag: "@smoke" }, () => {
  requirePosCredentials(test);           // skip if env vars are missing
  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/route",  assert: (p) => assertFn(p, "Expected text") },
    { path: "/admin/other",  assert: (p) => assertOtherFn(p, "Other text") },
  ]);
});
```

**There are no `test.step` calls, no domain helpers, no seed data, and no `waitForResponse`.** If a spec contains anything beyond the above, that is an anomaly.

---

## Specs — routes covered

### `ajustes.spec.js` — Admin Settings (20 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/settings/general` | `assertTextContains` | "Configuraciones de Empresa" |
| `/admin/settings/franchise` | `assertTextContains` | "Franquicia" |
| `/admin/settings/signature` | `assertTextContains` | "Configuraciones de Firma Electrónica" |
| `/admin/settings/banner` | `assertTextContains` | "Gestión de Banners" |
| `/admin/settings/printers` | `assertTextContains` | "Configuraciones de Impresoras" |
| `/admin/settings/notifications` | `assertTextContains` | "Notificaciones" |
| `/admin/settings/forms` | `assertTextContains` | "Formularios" |
| `/admin/account` | `assertTextContains` | "Perfil de Usuario" |
| `/admin/subsidiaries/list` | `assertPageTitle` | "Sucursales" |
| `/admin/subsidiaries/add` | `assertTextContains` | "Agregar una Sucursal" |
| `/admin/warehouses/list` | `assertPageTitle` | "Bodegas" |
| `/admin/warehouses/add` | `assertTextContains` | "Creación de Bodega" |
| `/admin/dispatch-types/list` | `assertPageTitle` | "Tipos de Despacho" |
| `/admin/dispatch-types/add` | `assertTextContains` | "Agregar tipo de despacho" |
| `/admin/checkouts/list` | `assertPageTitle` | "Puntos de Emisión" |
| `/admin/checkouts/add` | `assertTextContains` | "Crear punto de Emisión" |
| `/admin/support/tickets/list` | `assertPageTitle` | "Mis Tickets" |
| `/admin/support/tickets/create` | `assertMainContains` | "Selecciona una categoría" |
| `/admin/ats` | `assertTextContains` | "Generador de ATS" |
| `/admin/ats-list` | `assertPageTitle` | "Registros de ATS" |

---

### `finanzas-cuentas.spec.js` — Finance > Accounts (11 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/receivables/list` | `assertPageTitle` | "Cuentas por Cobrar" |
| `/admin/payments/list` | `assertPageTitle` | "Cuentas por Pagar" |
| `/admin/payment-drafts/list?filter_status[0]=pending&filter_status[1]=validating` | `assertPageTitle` | "Borradores de Pago" |
| `/admin/payment-drafts/add` | `assertMainContains` | "Crear Borrador de Pago" |
| `/admin/payment-drafts/massive-approval` | `assertTextVisible` | "Aprobación Masiva de Borradores de Pago" |
| `/admin/authorize-dispatch-sales?filter_delivered=false&filter_can_dispatch=false&filter_is_canceled=false` | `assertPageTitle` | "Aprobar despachos" |
| `/admin/payments/add/receivables` | `assertTextContains` | "Registrar un Pago" |
| `/admin/payments/add/paymentAccounts` | `assertTextContains` | "Registrar un Pago" |
| `/admin/payments/add/multiple-receivables` | `assertMainContains` | "Abono Múltiple" |
| `/admin/advances/customer` | `assertTextContains` | "Anticipo de Clientes" |
| `/admin/advances/provider` | `assertTextContains` | "Anticipo a Proveedores" |

---

### `finanzas-tesoreria.spec.js` — Finance > Treasury (5 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/treasury/home` | `assertAnyTextVisible` | "Abrir Caja de Tesorería" **or** "Pagos de Tesorería" |
| `/admin/payment_methods/list` | `assertPageTitle` | "Métodos de Pago" |
| `/admin/paymentMethods/add` | `assertTextVisible` | "Agregar Método de Pago" |
| `/admin/financialEntity/list` | `assertPageTitle` | "Bancos" |
| `/admin/financialEntity/add` | `assertTextVisible` | "Agregar Banco" |

> **Note:** `/admin/treasury/home` uses `assertAnyTextVisible` because the displayed text varies depending on whether the treasury register is currently open or closed.

---

### `inventario-garantias.spec.js` — Inventory > Warranties & Returns (6 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/warranty/sales/list` | `assertPageTitle` | "Garantías de Ventas" |
| `/admin/warranty/sales/add` | `assertTextContains` | "Registrar Garantía de Ventas" |
| `/admin/warranty/purchases/list` | `assertPageTitle` | "Garantías de Compras" |
| `/admin/warranty/purchases/add` | `assertTextContains` | "No hay compra seleccionada" |
| `/admin/sales/returns/list?per_page=10` | `assertPageTitle` | "Devoluciones de Ventas" |
| `/admin/purchases/returns/list` | `assertPageTitle` | "Devoluciones de Compras" |

---

### `inventario-gestion.spec.js` — Inventory > Inventory Management (15 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/kardex/list` | `assertPageTitle` | "Kardex" |
| `/admin/adjustments/list` | `assertPageTitle` | "Ajustes de Inventario" |
| `/admin/adjustments/add?name=Manual` | `assertTextContains` | "Crear un Ajuste" |
| `/admin/adjustments/add-series?name=Serie` | `assertTextContains` | "Crear un Ajuste de Serie" |
| `/admin/adjustments/add-massive?name=Masivo` | `assertTextContains` | "Ajustes Masivos" |
| `/admin/transfers/list` | `assertPageTitle` | "Transferencias" |
| `/admin/transfers/add/internal?name=Interna` | `assertTextContains` | "Transferencia Interna" |
| `/admin/transfers/add/external?name=Externa` | `assertMainContains` | "Transferencia" |
| `/admin/dispatch-sales?filter_delivered=false&filter_can_dispatch=true&filter_is_canceled=false` | `assertPageTitle` | "Despacho Posterior" |
| `/admin/recept-purchases?filter_type=no_inventory` | `assertPageTitle` | "Recepción de Compras" |
| `/admin/premanufactured-inventory` | `assertTextContains` | "Ajustar Producto Pre Elaborado" |
| `/admin/physical-inventory/list` | `assertPageTitle` | "Toma Física de Inventario" |
| `/admin/physical-inventory/add` | `assertMainContains` | "Toma Física de Inventario" |
| `/admin/inventory-reset` | `assertTextContains` | "Encerado de Inventario de Productos" |
| `/admin/products-bin` | `assertMainContains` | "Papelera de Productos" |

---

### `inventario-productos.spec.js` — Inventory > Products & Services (17 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/products/list` | `assertPageTitle` | "Gestión de Productos" |
| `/admin/services/list` | `assertPageTitle` | "Gestión de Servicios" |
| `/admin/productPriceList` | `assertTextContains` | "Gestión de Precios de productos" |
| `/admin/discounts/list` | `assertPageTitle` | "Descuentos" |
| `/admin/discounts/add` | `assertTextVisible` | "Crear Descuento" |
| `/admin/surcharges/list` | `assertPageTitle` | "Recargos" |
| `/admin/surcharges/add` | `assertTextVisible` | "Crear recargo" |
| `/admin/categories/list` | `assertMainContains` | "Categorías" |
| `/admin/categories/add` | `assertTextContains` | "Crear Categoría" |
| `/admin/brands/list` | `assertPageTitle` | "Marcas" |
| `/admin/brands/add` | `assertTextContains` | "Crear Marca" |
| `/admin/sizes/list` | `assertPageTitle` | "Tallas de Productos" |
| `/admin/sizes/add` | `assertTextVisible` | "Crear Talla" |
| `/admin/colors/list` | `assertPageTitle` | "Colores de Productos" |
| `/admin/colors/add` | `assertTextVisible` | "Crear Color" |
| `/admin/tags` | `assertTextVisible` | "Listado de Etiquetas" |
| `/admin/tags/create` | `assertTextVisible` | "Crear Etiqueta" |

---

### `personas.spec.js` — Admin People (11 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/people/list` | `assertPageTitle` | "Personas" |
| `/admin/people/add` | `assertTextContains` | "Nueva Persona" |
| `/admin/rates/list` | `assertPageTitle` | "Tarifas" |
| `/admin/rates/add` | `assertTextContains` | "Crear Tarifa" |
| `/admin/users/list` | `assertPageTitle` | "Usuarios" |
| `/admin/users/add` | `assertTextContains` | "Nuevo Usuario" |
| `/admin/roles/list` | `assertPageTitle` | "Roles" |
| `/admin/roles/add` | `assertTextContains` | "Nuevo Rol" |
| `/admin/apartments/list` | `assertPageTitle` | "Departamentos" |
| `/admin/apartments/add` | `assertTextContains` | "Nuevo Departamento" |
| `/admin/users/restore` | `assertMainContains` | "Papelera de Usuarios" |

---

### `pos-comercios.spec.js` — POS Commerce (5 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/pos/close-cash-register` | `assertTextContains` | "Cierre de Caja" |
| `/pos/saved-sales` | `assertTextContains` | "Ventas Guardadas" |
| `/pos/account-payments` | `assertTextContains` | "Pagos de Cuentas por Cobrar" |
| `/pos/cash-register-sales` | `assertTextContains` | "Ventas Realizadas" |
| `/pos/consume-quotes` | `assertMainContains` | "Recuperar Cotizaciones" |

---

### `pos-home.spec.js` — POS Home (1 route)

| Route | Assert | Expected text |
|---|---|---|
| `/pos/home` | `assertProductCardsVisible` | — (first `.custom-card` visible, timeout 45 s) |

> This is the only route that does not check for text — it checks for the presence of product cards. The extended timeout accounts for the time the catalog takes to load.

---

### `pos-restaurantes.spec.js` — POS Restaurants (3 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/pos/restaurant-home` | `assertProductCardsVisible` | — (first `.custom-card`, timeout 45 s) |
| `/pos/close-restaurant-order` | `assertTextContains` | "Cerrar Orden" |
| `/pos/change-order-status` | `assertTextContains` | "Cambiar Estado de Orden" |

---

### `principal.spec.js` — Admin Home + Reports (14 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/home` | `assertAdminHomeWelcome` | "Bienvenido ¡Tu crecimiento comienza aquí!" |
| `/admin/reports/create` | `assertTextVisible` | "Generación de Reportes" |
| `/admin/reports/create?reportId=reporte-de-ventas` | `assertTextVisible` | "Reportes de Ventas" |
| `/admin/reports/create?reportId=reporte-de-ventas-por-producto` | `assertTextVisible` | "Reportes de Ventas por Producto" |
| `/admin/reports/create?reportId=reporte-de-ventas-por-producto-de-tipo-combo` | `assertTextVisible` | "Reportes de Ventas por Producto de tipo Combo" |
| `/admin/reports/create?reportId=reporte-detallado-de-ventas-por-producto` | `assertTextVisible` | "Reporte Detallado de Ventas por Producto" |
| `/admin/reports/create?reportId=reporte-de-ventas-por-metodo-de-pago` | `assertTextVisible` | "Reportes de Ventas por Método de Pago" |
| `/admin/reports/create?reportId=reporte-de-cotizaciones` | `assertTextVisible` | "Reportes de Cotizaciones" |
| `/admin/reports/create?reportId=reporte-de-inventarios` | `assertTextVisible` | "Reporte General de Inventarios" |
| `/admin/reports/create?reportId=reporte-de-inventarios-serie` | `assertTextVisible` | "Reportes de Inventarios de Producto Serie" |
| `/admin/reports/create?reportId=reporte-tributario` | `assertTextVisible` | "Reporte Tributario" |
| `/admin/reports/create?reportId=reporte-de-cuentas-por-cobrar` | `assertTextVisible` | "Reporte de Cuentas Por Cobrar" |
| `/admin/reports/create?reportId=reporte-de-cuentas-por-pagar` | `assertTextVisible` | "Reporte de Cuentas Por Pagar" |
| `/admin/reports/create?reportId=reporte-de-cierres-de-caja` | `assertTextVisible` | "Reporte de Cierres de Caja" |

---

### `restaurantes.spec.js` — Admin Restaurants (3 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/orders/list` | `assertPageTitle` | "Ordenes" |
| `/admin/orders-reconciliations/list` | `assertPageTitle` | "Ordenes por Regularizar" |
| `/admin/tables/management` | `assertTextContains` | "Áreas" |

---

### `transacciones-compras.spec.js` — Transactions > Purchases (6 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/purchases/list/` | `assertPageTitle` | "Historial de Compras" |
| `/admin/inventory-purchases/add` | `assertTextVisible` | "Compras con Movimientos de Inventario" |
| `/admin/no-inventory-purchases/add` | `assertTextVisible` | "Compras sin Movimientos de Inventario" |
| `/admin/withholdings/` | `assertPageTitle` | "Retenciones de Compras" |
| `/admin/credit_notes/list` | `assertPageTitle` | "Notas de Crédito Compras" |
| `/admin/credit_notes/add` | `assertTextContains` | "Agregar Nota de Crédito por" |

---

### `transacciones-otros-documentos.spec.js` — Transactions > Other Documents (7 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/quotes/list` | `assertPageTitle` | "Cotizaciones" |
| `/admin/quotes/add` | `assertTextVisible` | "Agregar Cotización" |
| `/admin/waybills/list` | `assertPageTitle` | "Guías de Remisión" |
| `/admin/waybills/add/internal?creates_transfer=0` | `assertTextContains` | "Creación de Guía de Remisión Interna" |
| `/admin/waybills/add/external` | `assertTextContains` | "Creación de Guía de Remisión Externa" |
| `/admin/cash-registers/list` | `assertPageTitle` | "Historial de Cierres de Caja" |
| `/admin/edocuments/list` | `assertPageTitle` | "Documentos Electrónicos" |

---

### `transacciones-ventas.spec.js` — Transactions > Sales (7 routes)

| Route | Assert | Expected text |
|---|---|---|
| `/admin/sales/list?per_page=10` | `assertPageTitle` | "Historial de Ventas" |
| `/admin/ventas/add` | `assertTextVisible` | "Datos de Venta" |
| `/admin/pre-sale/add` | `assertTextVisible` | "Agregar Preventa" |
| `/admin/sales-withholdings/` | `assertPageTitle` | "Retenciones de Ventas" |
| `/admin/withholdings/sales/add` | `assertTextVisible` | "Crear Retención" |
| `/admin/sale-credit_notes/list` | `assertPageTitle` | "Notas de Crédito Ventas" |
| `/admin/credit_notes/sales/add` | `assertTextVisible` | "Notas de Crédito de Venta" |

---

## Summary — route count per spec

| Spec | Routes |
|---|---|
| `ajustes.spec.js` | 20 |
| `finanzas-cuentas.spec.js` | 11 |
| `finanzas-tesoreria.spec.js` | 5 |
| `inventario-garantias.spec.js` | 6 |
| `inventario-gestion.spec.js` | 15 |
| `inventario-productos.spec.js` | 17 |
| `personas.spec.js` | 11 |
| `pos-comercios.spec.js` | 5 |
| `pos-home.spec.js` | 1 |
| `pos-restaurantes.spec.js` | 3 |
| `principal.spec.js` | 14 |
| `restaurantes.spec.js` | 3 |
| `transacciones-compras.spec.js` | 6 |
| `transacciones-otros-documentos.spec.js` | 7 |
| `transacciones-ventas.spec.js` | 7 |
| **Total** | **131** |

---

## CI — how it runs in GitHub Actions

The `e2e.yml` workflow runs the smoke suite on every push to `develop` and is also available as a manual `workflow_dispatch`.

```
job: smoke
  runs-on: ubuntu-latest
  timeout-minutes: 30
  workers: 2
  PLAYWRIGHT_BASE_URL: https://1792780241001.wanqara.org
  command: npx playwright test --project=Smoke --workers=2
```

On completion (always, including on failure) it sends a Telegram notification with a passed/failed/flaky/skipped summary and uploads the HTML report as an artifact with a 7-day retention period.

---

## Conventions and rules

- **One test = one route.** The Playwright test name is `GET /the/route` — that is how it appears in reports and Telegram notifications.
- **No seed data required.** List routes may be empty; smoke only verifies that the page loaded, not that records exist.
- **No data is created or modified.** If a spec seems to require data to pass (e.g. a table with rows), the assert must use `assertPageTitle` (toolbar) rather than `assertTableHasRows` — this is already the established pattern in all current specs.
- **`assertAnyTextVisible` is used when tenant state can vary** (e.g. `treasury/home` may show different text depending on whether the register is open).
- **Adding a new route:** add a `{ path, assert }` object to the appropriate spec's array. No other changes are needed.
- **Adding a new domain:** create a new `name.spec.js` following the exact pattern of the existing specs and import `generateSmokeTests` plus the required assert functions.