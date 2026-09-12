# Brands Module Architecture Guide (DDT + Modular Legos)

## Overview
This directory implements a **Modular Data-Driven Testing (DDT)** architecture. We do not use monolithic tests. Instead, business logic is separated into atomic "Lego" components (Helpers) and assembled inside specialized Orchestrators (Specs). Everything is driven by co-located JSON configurations.

**For AI Agents:** Do not write procedural, hardcoded tests here. Do not create massive "God functions" for CRUD. If a new flow is needed, assemble existing Legos inside a new Spec, and feed it with a new JSON file.

---

## 1. Modular "Lego" Architecture

The Brands module is broken down into three distinct layers:

### A. The Legos (Helpers)
Located in `harness/brand-helpers.js`. These are pure, atomic functions that perform a single UI action (e.g., `createBrand`, `searchBrand`, `deleteBrand`). They contain no test assertions regarding the business workflow, only UI interaction logic.

### B. The Orchestrators (Specs)
Instead of a single `brands.spec.js`, we have isolated specs for isolated testing:
*   `brands-create.spec.js`: Only tests the creation logic.
*   `brands-search.spec.js`: Only tests the search functionality.
*   `brands-delete.spec.js`: Only tests the deletion process.
*   `brands-crud.spec.js`: The master spec that tests the full lifecycle (Create -> Search -> Delete).

### C. UI Preconditions (Avoiding Flakiness)
Specs like `brands-search.spec.js` require data to exist before searching. **We do not use the API for preconditions here.** Instead, the Spec orchestrates this by calling the `createBrand` Lego inside a `test.step('Precondición')` before running the actual search logic. This ensures a clean, isolated state per test using the UI.

---

## 2. The JSON Contract & Co-Location

Every Spec has a strict 1:1 relationship with a JSON file located in the `0-json-data/` folder (e.g., `brands-create.json` feeds `brands-create.spec.js`).

### ⚙️ JSON Schema Breakdown
*   **`id`**: Unique identifier (e.g., `BRD-CREATE-001`). Used for traceability.
*   **`description`**: The name of the test in the Playwright HTML report.
*   **`brandData`**: The payload injected into the UI forms.
*   **`authType` (CRITICAL)**: Values like `"retail"`, `"dispatch"`, or `"restaurant"`. The framework automatically fetches the ultra-fast cached session (`.auth/[authType]-session.json`) and injects it. To test a new subsidiary, simply change this string.

---

## 3. Controlling Execution (Local Development)

Control execution directly from the JSON to avoid modifying the `.spec.js`:

*   **`only: true`**
    *   *Usage:* Focuses execution strictly on this scenario. Playwright will ignore all other scenarios in the JSON.
    *   *Best Practice:* Use locally when building or fixing a case. **Never commit to the main branch.**
*   **`skip: true`**
    *   *Usage:* Bypasses the test entirely.
    *   *Requirement:* You **must** populate the `skipReason` field (e.g., `"skipReason": "Backend bug WS-1099"`). This string is injected into the final Playwright HTML report to document why coverage dropped.

---

## 4. CI/CD Pipeline Routing (`metadata.testScope`)

We rely on dynamic tagging driven by the JSON to route tests to the correct pipeline.

*   **`"testScope": "release"`**
    *   Playwright dynamically appends the `@release` tag to the test block.
    *   **Where it runs:** GitHub Actions (Release Pipeline).
    *   *Use case:* Running specific scenarios as a smoke/release gate for a new feature.
*   **`"testScope": "regression"`**
    *   Playwright dynamically appends the `@regression` tag.
    *   **Where it runs:** Local machines and Nightly/Weekly full regression runs. (Ignored by GitHub Actions).
    *   *Use case:* Stabilized tests protecting the codebase over time.

### Traceability Rule
When a release is over, **do not delete** the `release` version string (e.g., `"release": "v7.9.1"`). Instead, change `"testScope": "release"` to `"testScope": "regression"`. This keeps the historical origin of the test intact while moving its execution scope to the daily regression suite.
