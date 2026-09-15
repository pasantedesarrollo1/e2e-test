# Discounts Module Architecture Guide (DDT + Modular Legos)

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture. Unlike simpler entities, discounts have dynamic summary renderings based on their configuration (`always`, `every_to`, `from_to`). 

To address this, the specs are separated into standard CRUD operations AND a specialized Summary Orchestrator (`discounts-summary.spec.js`).

**For AI Agents:** Do not write procedural, hardcoded tests here. Assemble existing Legos inside a new Spec, and feed it with a new JSON file.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/discount-helpers.js`. 
*   `fillDiscountForm`: Purely fills the complex form.
*   `assertDiscountSummary`: Reads the right-side summary card and validates the rendering based on the configuration logic.
*   `createDiscount`: A composite helper that fills and saves.
*   `searchDiscount` & `deleteDiscount`: Standard list operations.

### B. The Orchestrators (Specs)
*   `discounts-summary.spec.js`: Iterates over `discounts-summary.json` to purely test the UI rendering of the summary card before saving. It does NOT save the discount.
*   `discounts-create.spec.js`: Tests the creation logic.
*   `discounts-search.spec.js`: Tests the search functionality.
*   `discounts-delete.spec.js`: Tests the deletion process.
*   `discounts-crud.spec.js`: The master spec that tests the full lifecycle.

### C. UI Preconditions
Specs like `discounts-search.spec.js` require data to exist before searching. We orchestrate this by calling the `createDiscount` Lego inside a `test.step('Precondición')` before running the actual search logic.

---

## 2. The JSON Contract & Co-Location

Every Spec has a strict 1:1 relationship with a JSON file located in the `0-json-data/` folder.

### ⚙️ JSON Schema Breakdown (discountData)
*   **`name`**: String (Name of the discount).
*   **`applicationMethod`**: `"always" | "every_to" | "from_to"`
*   **`type`**: `"porcentaje" | "fijo"`
*   **`discount`**: Number (Value of the discount).
*   **`quantity`**: Number (Only required if method is not `"always"`).

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
