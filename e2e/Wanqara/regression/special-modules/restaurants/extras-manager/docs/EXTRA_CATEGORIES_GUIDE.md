# Extra Categories Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture for Special Modules / Restaurants / Extras Manager / Extra Categories.

**For AI Agents:** This domain covers a very complex lifecycle flow where Extra Categories are created, populated with related products, validated against deletion constraints (cannot delete if products are linked), unlinked, deleted, and recreated for the alternative `Por producto` correlation flow.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/extras-crud-helpers.js` and `harness/extras-by-product-helpers.js`. 
*   **Extras CRUD Helpers**: `createExtraCategory`, `assignProductsToExtraCategory`, `deleteExtraCategory`, `verifyDeletionConstraintsAndRemoveProducts` handle the granular interactions in the "Por categoría" view.
*   **Extras By Product Helpers**: `testByProductFlow` handles the alternate "Por producto" view where relations are mapped inversely.

### B. The Orchestrators (Specs)
*   `extra-categories.spec.js`: Encapsulates 5 highly sequential steps into a single orchestrator test. 
    1. Force clean state.
    2. Create & Assign.
    3. Validate deletion constraints.
    4. Delete & Recreate.
    5. Test "Por producto" relations.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/extra-categories.json`
*   **`extrasData`**: Defines the data required for this lifecycle.
    *   **`categoryName`**: Name of the extra category (e.g. `Extras Alitas`).
    *   **`searchTerm`**: Used to filter the list of products (e.g. `alitas`).
    *   **`productsToAssign`**: Array of product names expected to be assigned as extras.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
