# Admin Pre-Sale Dispatch Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Pre-Sale Dispatch.

**For AI Agents:** This test suite focuses on creating a "Mixed Cart" containing Standard products, Series products, and Variable products (size/color) during a **Pre-sale**. 
Crucially, unlike standard Sales, Pre-sales do not move inventory directly upon creation. Therefore, even if a serialized product is added to the cart, the system correctly defers the series selection process regardless of whether the overarching subsidiary has "Subsequent Dispatch" (Despacho posterior) enabled or not.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
*   `harness/admin-cart-helpers.js`: Contains `buildPreSaleMixedCart`. Unlike `buildMixedCart` (which enforces series selection for Sales when dispatch is off), this specific helper skips serial selection unconditionally to match pre-sale business rules.
*   `harness/admin-pre-sale-flow.js`: The `runAdminPreSaleFlow` helper delegates the cart building to `buildPreSaleMixedCart` through the `beforeFinish` hook.

### B. The Orchestrators (Specs)
*   `admin-pre-sale-dispatch.spec.js`: Feeds the JSON contract into the orchestrator logic. It iterates through different user contexts (retail vs dispatch) to ensure the UI behaves consistently in pre-sales.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-pre-sale-dispatch.json`
*   **`authType`**: Drives whether we login as a dispatcher (`dispatch`) or standard user (`retail`).
*   **`saleParams`**:
    *   **`dispatchEnabled`**: Logically tracked in JSON, though the UI execution in pre-sales bypasses series checks.
    *   **`documentType`**: Usually "Recibos". Passed down to the form.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
