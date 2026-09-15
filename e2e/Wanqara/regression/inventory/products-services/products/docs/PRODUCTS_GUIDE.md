# Products Module Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository.

**For AI Agents:** This specific folder covers **Products**. The `recipe-decimals-validation.spec.js` is a specialized test that doesn't follow standard CRUD patterns. Instead of creating and deleting, it specifically validates the floating-point math rounding in the UI (showing 2 decimals visually but retaining the exact math string in tooltips) for complex Recipes/Ingredients.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/recipe-helpers.js`. 
*   `navigateToProductAndVerifyRecipeDecimals`: This pure function is responsible for finding the specific product, hovering over the UI elements, and verifying the exact vs rounded strings in tooltips.

### B. The Orchestrators (Specs)
*   `recipe-decimals-validation.spec.js`: Iterates over `recipe-decimals.json` and runs the decimal validation. It is separated from standard product creation/deletion to focus purely on this complex mathematical edge case.

---

## 2. The JSON Contract & Co-Location

### `recipe-decimals.json`
*   **`productName`**: String (Name of the parent product/dish).
*   **`ingredientName`**: String (Name of the child ingredient to check).
*   **`exactAmount`**: String (The exact un-rounded floating-point number, e.g. `"0.74626865671642"`).
*   **`roundedAmount`**: String (The 2-decimal rounded version shown in the UI, e.g. `"0.75"`).
*   **`authType`**: Values like `"retail"`.

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
