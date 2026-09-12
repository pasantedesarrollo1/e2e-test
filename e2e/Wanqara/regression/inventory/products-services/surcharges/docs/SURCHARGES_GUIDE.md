# Surcharges Module Architecture Guide (DDT + Modular Legos)

## Overview
This directory implements the same **Modular Data-Driven Testing (DDT)** architecture applied across the repository.

**For AI Agents:** Do not write procedural, hardcoded tests here. Do not create massive "God functions" for CRUD. Assemble existing Legos inside a new Spec, and feed it with a new JSON file.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/surcharge-helpers.js`. These are pure, atomic functions that perform a single UI action (`createSurcharge`, `searchSurcharge`, `deleteSurcharge`). 

### B. The Orchestrators (Specs)
*   `surcharges-create.spec.js`: Only tests the creation logic.
*   `surcharges-search.spec.js`: Only tests the search functionality.
*   `surcharges-delete.spec.js`: Only tests the deletion process.
*   `surcharges-crud.spec.js`: The master spec that tests the full lifecycle (Create -> Search -> Delete).

### C. UI Preconditions
Specs like `surcharges-search.spec.js` require data to exist before searching. We orchestrate this by calling the `createSurcharge` Lego inside a `test.step('Precondición')` before running the actual search logic.

---

## 2. The JSON Contract & Co-Location

Every Spec has a strict 1:1 relationship with a JSON file located in the `0-json-data/` folder.

### ⚙️ JSON Schema Breakdown
*   **`id`**: Unique identifier (e.g., `SUR-CREATE-001`).
*   **`description`**: Name of the test in the Playwright HTML report.
*   **`surchargeData`**: The payload injected into the UI forms (name, percentage).
*   **`authType` (CRITICAL)**: Values like `"retail"`.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.

---

## 4. CI/CD Pipeline Routing (`metadata.testScope`)

*   **`"testScope": "release"`**: Runs in GitHub Actions.
*   **`"testScope": "regression"`**: Runs locally and Nightly. (Ignored by GitHub Actions).

### Traceability Rule
When a release is over, **do not delete** the `release` version string (e.g., `"release": "v7.9.1"`). Change `"testScope": "release"` to `"testScope": "regression"`.
