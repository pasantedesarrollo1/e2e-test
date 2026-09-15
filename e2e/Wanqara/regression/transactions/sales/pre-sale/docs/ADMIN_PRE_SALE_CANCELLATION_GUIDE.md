# Admin Pre-Sale Cancellation Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Pre-sale Cancellation.

**For AI Agents:** This test suite verifies the ability to cancel an Administrative Pre-Sale successfully. It ensures that the cancellation modal behaves correctly according to context rules (e.g., whether to expect a warning message or a secondary switch option depending on the dispatch settings). It validates this across Restaurant (No Dispatch) and Retail/Business (With Dispatch).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
*   `harness/admin-pre-sale-flow.js`: Contains `runAdminPreSaleFlow` which handles the logic to build a pre-sale document.
*   `harness/cancel-sale-helpers.js`: Reuses the `cancelFirstSaleAndVerify` function built for Standard Sales to cancel the topmost entry in the grid and verify the resulting UI (modal assertions).

### B. The Orchestrators (Specs)
*   `admin-pre-sale-cancellation.spec.js`: Iterates over the JSON payload. Uses **browser.newContext** in a `.serial` queue to strictly enforce session isolation between subsequent destructive events.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-pre-sale-cancellation.json`
*   **`authType`**: Dictates the business context ("restaurant" vs "dispatch").
*   **`saleParams`**: Parameters given to the creation helper (`runAdminPreSaleFlow`).
*   **`cancelParams`**: Parameters given to the destruction helper (`cancelFirstSaleAndVerify`):
    *   **`expectSwitch`**: Asserts whether the "Return items to inventory" switch should appear.
    *   **`expectMessage`**: Asserts whether the warning "this action cannot be undone" message appears.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
