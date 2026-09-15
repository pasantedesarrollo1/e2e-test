# Colors Module Architecture Guide (DDT + Modular Legos)

## Overview
This directory implements a **Modular Data-Driven Testing (DDT)** architecture exactly like the Brands module. Business logic is separated into atomic "Lego" components (Helpers) and assembled inside specialized Orchestrators (Specs), driven by co-located JSON configurations.

**For AI Agents:** Do not write procedural, hardcoded tests here. Do not create massive "God functions" for CRUD. Assemble existing Legos inside a new Spec, and feed it with a new JSON file.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/color-helpers.js`. These are pure, atomic functions that perform a single UI action (`createColor`, `searchColor`, `deleteColor`). 

### B. The Orchestrators (Specs)
*   `colors-create.spec.js`: Only tests the creation logic.
*   `colors-search.spec.js`: Only tests the search functionality.
*   `colors-delete.spec.js`: Only tests the deletion process.
*   `colors-crud.spec.js`: The master spec that tests the full lifecycle (Create -> Search -> Delete).

### C. UI Preconditions
Specs like `colors-search.spec.js` require data to exist before searching. We orchestrate this by calling the `createColor` Lego inside a `test.step('Precondición')` before running the actual search logic.

---

## 2. The JSON Contract & Co-Location

Every Spec has a strict 1:1 relationship with a JSON file located in the `0-json-data/` folder.

### ⚙️ JSON Schema Breakdown
*   **`id`**: Unique identifier (e.g., `CLR-CREATE-001`).
*   **`description`**: Name of the test in the Playwright HTML report.
*   **`colorData`**: The payload injected into the UI forms (name, observation).
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
