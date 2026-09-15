# Admin Sale Modifiers Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Sale Modifiers.

**For AI Agents:** This test suite verifies the ability to apply pre-payment modifiers to an administrative sale, specifically **General Discounts** and **Manual Surcharges**. It validates these workflows across different subsidiary contexts (e.g., retail vs. dispatch).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/admin-sale-flow.js`. 
*   `runAdminSaleFlow`: The core helper that executes the sale. It accepts a `beforeFinish` callback hook.
*   `applyGeneralDiscount`: Interacts with the UI to apply a percentage or fixed discount to the entire cart.
*   `applyManualSurcharge`: Interacts with the UI to apply an extra charge before finishing the sale.

### B. The Orchestrators (Specs)
*   `admin-sale-modifiers.spec.js`: Feeds the JSON contract into the orchestrator logic. It uses a mapping object (`MODIFIERS_MAP`) to translate a simple string in the JSON into the actual callback function that `runAdminSaleFlow` expects.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-sale-modifiers.json`
*   **`authType`**: Dictates the business context ("retail" vs "dispatch").
*   **`saleParams`**:
    *   **`modifierType`**: The string token ("discount" or "surcharge") which the orchestrator maps to `applyGeneralDiscount` or `applyManualSurcharge` respectively.
    *   **`documentType`**: The document issued (usually "Recibos").
    *   **`productName`**: The item to ring up before modifying the total.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
