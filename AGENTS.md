# AGENTS.md

## 🤖 Antigravity & AI Agent Guide for `e2e-test`

Welcome, fellow Agent! This document serves as your definitive guide to understanding and modifying the `e2e-test` repository. Before making any changes or writing new Playwright tests, you **must** adhere strictly to the rules and patterns described here.

---

### 🏗️ 1. Project Overview & Architecture

This repository holds the E2E test suites for the Wanqara POS and Admin web applications using Playwright.

**Architectural Pattern: The Shared Harness Pattern**
We **do not** use traditional Page Object Models (POM) in this project. Instead, we heavily rely on a **Shared Harness (Step-Function / Helper) Pattern**.

*   **Harness Directory (`e2e/Wanqara/harness/`):** All common behaviors, authentication, assertions, and DOM interactions are abstracted here.
*   **Actionable Helpers:** When interacting with generic CRUD interfaces or complex UI elements, you must use existing helpers like `ensureCleanRecord`, `saveFormAndVerify`, and `deleteRecordFromList` (from `crud-helpers.js`), and `selectDropdownOption` (from `ui-helpers.js`).
*   **Test Specs (`e2e/Wanqara/regression/`):** Specs should read almost like declarative workflows. Rely on `test.step()` to structure the tests logically and utilize the harness functions to perform the heavy lifting.

---

### 🔐 2. Authentication & Environments

Authentication state is shared and restored automatically to speed up tests.

*   Tests specify their required credentials using `requirePosCredentials(test)` (from `harness/settings.js`), which injects the `tenantBaseUrl` into the context.
*   Different projects are configured in `playwright.config.js` to run against various roles (e.g., POS-Retail, POS-Restaurant, Admin-Inventory, Chef).
*   Avoid manually authenticating inside test specs. The `auth.js` harness and the global setup handle this. If a session expires during a test, the harness has built-in retry mechanisms (`ensureAuthenticated`).

---

### 🗃️ 3. Test Data Strategy

**Rule: DO NOT use hardcoded test data (strings, numbers, names) in the test specs.**

*   All testing data is centrally managed through the `SEED` object, imported from `harness/seed.js` (which aggregates data from the `seeds/` directory).
*   When you need an entity name, an RUC, user credentials, or specific configuration values, look it up in the `SEED` object (e.g., `SEED.attributes.brand.name`, `SEED.discount.crud.alwaysPercentage`).
*   If a new test requires new data, add it to the corresponding seed file first.

---

### 🔍 4. DOM Selector Strategy (Vuetify Specific)

The application UI is built with **Vuetify**. Due to how Vuetify handles the DOM, standard locators can sometimes be tricky.

**Rules for Locators:**
1.  **Prefer User-Facing Locators:** We rarely use `data-testid`. Prefer `page.getByRole()`, `page.getByPlaceholder()`, `page.getByText()`, and `page.getByLabel()`.
2.  **Handling Tables:** Vuetify tables are targeted using `.v-data-table__tr`. You can find a row by combining a filter: `page.locator(".v-data-table__tr").filter({ hasText: "Search Term" })`.
3.  **Handling Dropdowns & Menus:** Vuetify mounts dropdown lists, menus, and tooltips at the root of the DOM, outside the component tree, usually within a `.v-overlay-container`. Use `selectDropdownOption` from `ui-helpers.js` to interact with them safely rather than trying to click standard `select` tags.
4.  **Handling Notifications/Snackbars:** Success or error messages appear as `.v-snackbar`. Use `expectSnackbar(page, "Success Message")` from `ui-helpers.js`.
5.  **Handling Hover Actions (Speed Dials):** Data table action buttons are often hidden behind a hover state or speed dial. See `clickTableRowAction` in `crud-helpers.js` for the complex resolution logic needed to interact with tooltips and overlay buttons.

---

### 🛠️ 5. Important Commands

When running tasks, rely on standard Playwright commands:
*   Run all tests: `npx playwright test`
*   Run specific project: `npx playwright test --project="Admin-Inventory"`
*   Run with UI: `npx playwright test --ui`
*   Update snapshots (if applicable): `npx playwright test --update-snapshots`
*   Debug: `npx playwright test --debug`

If you are equipped with the **Playwright MCP tool**, use it to analyze traces, write resilient tests, and debug failures effectively!
