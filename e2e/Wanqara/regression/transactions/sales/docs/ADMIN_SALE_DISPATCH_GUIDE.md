# Admin Sale Dispatch Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Sale Dispatch.

**For AI Agents:** This test suite focuses on creating a "Mixed Cart" containing Standard products, Series products, and Variable products (size/color). Crucially, it validates how the presence (or absence) of **Subsequent Dispatch** (Despacho posterior) changes the cart interaction, such as whether a serialized product requires selecting its specific series at the moment of the sale or if it's deferred to the warehouse dispatcher.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
*   `harness/admin-cart-helpers.js`: Contains `buildMixedCart`, which populates the cart using complex items. It determines if it needs to trigger modals (like selecting a series) based on the `dispatchEnabled` boolean flag. 
*   `harness/admin-sale-flow.js`: The `runAdminSaleFlow` helper delegates the cart building to `buildMixedCart` through the `beforeFinish` hook.

*(Note: `buildMixedCart` intelligently reuses existing POS abstractions like `selectFirstVariant` and `selectFirstSerie` located in `regression/POS/harness/pos-products.js` to avoid duplicating modal-interaction logic).*

### B. The Orchestrators (Specs)
*   `admin-sale-dispatch.spec.js`: Feeds the JSON contract into the orchestrator logic. It uses the `dispatchEnabled` property to instruct the helper whether to skip series selection.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-sale-dispatch.json`
*   **`authType`**: Drives whether we login as a dispatcher (`dispatch`) or standard user (`retail`).
*   **`saleParams`**:
    *   **`dispatchEnabled`**: Boolean. If true, the system expects the cart logic to defer series selection (subsequent dispatch).
    *   **`documentType`**: Usually "Recibos". Passed down to the form.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
