# Release Suite — Reference

**Location:** `e2e/Wanqara/release/`
**Playwright project:** `Release`
**Test match pattern:** `/Wanqara/release/.*\.spec\.js/`
**storageState:** `retail-session.json` (default from config; individual specs override this)
**Tag:** `@release`
**Run command:** `npx playwright test --project=Release`

---

## What this suite is

Release specs validate **cross-cutting business rules that must pass before every deployment**. They exercise flows that depend on real tenant state and in some cases create and immediately destroy data to verify the system enforces the correct constraints.

If any spec in this suite fails, the release is blocked.

> Specs currently in this suite are skipped in `develop` (`test.skip(true, ...)`) because they belong to branches that have not yet been merged. They will be activated once the corresponding PRs land.

---

## Shared infrastructure

All release specs import helpers from **`e2e/Wanqara/release/herness/`** (note: `herness`, not `harness` — intentional).

| Helper file | Purpose |
|---|---|
| `cancel-sale-flow.js` | Navigates to `/admin/sales/list`, finds the most recent sale, opens the cancellation modal, asserts business-rule UI (inventory switch vs. no-inventory message), optionally confirms cancellation and validates the POST payload. |
| `multiple-receivables-flow.js` | Step-by-step helpers for the entire multiple-receivables payment flow: client selection, account picking, amount filling, submission, expected deletion error, settlement detail navigation, PDF voucher generation, and final deletion. |

Global harness dependencies:

| Global helper | Used for |
|---|---|
| `harness/settings.js` → `requirePosCredentials`, `getTenantBaseUrl` | Skip guard + tenant URL resolution |
| `harness/auth.js` → `getSessionPath`, `ensureAuthenticated` | Per-spec storageState path + navigation with session recovery |
| `harness/seed.js` → `SEED`, `getDynamicDocumentType`, `getElectronicInvoicingAuthType` | All test data constants and dynamic auth/document type resolution |
| `harness/urls.js` → `withPath` | URL concatenation |
| `regression/transactions/sales/harness/admin-sale-flow.js` → `runAdminSaleFlow` | Full admin sale creation (setup step in `cancel-sales`) |
| `regression/transactions/sales/harness/admin-pre-sale-flow.js` → `runAdminPreSaleFlow` | Full admin pre-sale creation (setup step in `cancel-sales`) |
| `regression/POS/harness/pos-sale-flow.js` → `runPosSaleFlow`, `selectClientByCedula` | Full POS sale creation (setup step in `cancel-sales`) |

---

## Specs

### 1. `cancel-sales.spec.js`

> **Status:** `test.skip(true, "Skipped in develop: Feature WS-840 belongs to an unmerged branch.")`

**What it tests:** The cancellation modal correctly shows or hides the *"Mover inventario"* switch depending on whether the sale has inventory movements. Subsidiaries with dispatch suppress the switch; restaurant and retail without dispatch show it.

**How it works:** For each scenario, creates a sale first (via `runAdminSaleFlow`, `runAdminPreSaleFlow`, or `runPosSaleFlow`), then calls `cancelFirstSaleAndVerify` which navigates to `/admin/sales/list`, finds the top row, opens the annulment modal, and asserts the modal contents. The sale is never actually cancelled — the modal is closed.

**Test structure:** `test.describe.serial` — three groups, each serial. Groups run in parallel.

| Test | authType | Sale type | `expectSwitch` | `expectMessage` |
|---|---|---|---|---|
| Restaurant (No Dispatch) | `restaurant` | Admin normal sale | `true` | `false` |
| Business (With Dispatch) | `dispatch` | Admin normal sale | `false` | `true` |
| Restaurant (No Dispatch) | `restaurant` | Admin pre-sale | `false` | `true` |
| Business (With Dispatch) | `dispatch` | Admin pre-sale | `false` | `true` |
| Retail (100) | `retail` | POS sale | `true` | `false` |
| Dispatch (101) | `dispatch` | POS sale | `false` | `true` |
| Restaurant (102) | `restaurant` | POS sale | `false` | `true` |

**Key detail:** Each test opens its own `browser.newContext` with the correct `storageState` — not the project-level one — because multiple authTypes are needed within the same file.

**Endpoints exercised (sale creation only):**
- `POST /api/v2/billing/sales`
- `POST /api/v2/billing/pre-sales`
- `POST /api/v2/pos/sales`

The cancellation modal does not hit any endpoint — it is opened and closed without confirming.

---

### 2. `multiple-receivables.spec.js`

> **Status:** `test.skip(true, "Skipped in develop: Feature WS-840 belongs to an unmerged branch.")`

**What it tests:** The complete "pay multiple receivable accounts at once" flow, including an expected deletion error from the list view and a successful deletion from the detail view.

**authType:** `getElectronicInvoicingAuthType()` — whichever subsidiary is configured as `Wanqara 001`.

**Route:** `/admin/payments/add/multiple-receivables`

**Test structure:** Single test, `test.describe` (not serial). `test.setTimeout(180_000)`.

**Flow:**