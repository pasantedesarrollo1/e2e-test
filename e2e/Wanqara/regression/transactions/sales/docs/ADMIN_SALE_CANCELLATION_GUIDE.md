# Admin Sale Cancellation Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Sale Cancellation.

**For AI Agents:** This test is specifically focused on the ability to cancel an existing sale from the Admin portal. It verifies that appropriate business logic checks (like the inventory rollback switch) are triggered depending on the user's role and subsidiary configuration (e.g., dispatch vs restaurant).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/cancel-sale-helpers.js`. 
*   `cancelFirstSaleAndVerify`: Intercepts the sales list API, finds the top record, executes the cancellation action, verifies the modal's expected state (switch presence, static text presence), confirms the cancellation, and verifies the network response.

*(Note: The test also heavily reuses `runAdminSaleFlow` from `admin-sale-flow.js` to set up the precondition by creating a new sale.)*

### B. The Orchestrators (Specs)
*   `admin-sale-cancellation.spec.js`: Feeds the JSON contract into the orchestrator logic. It iterates through the configured parameters, executing the sale creation followed by the cancellation check.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-sale-cancellation.json`
*   **`saleParams`**:
    *   **`documentType`**: "Factura electrónica" or "Recibos", passed into the sale creation helper.
    *   **`productName`**: The product sold during the setup step.
*   **`cancellationParams`**:
    *   **`expectSwitch`**: Boolean. Should the cancellation modal display the toggle switch to restock inventory?
    *   **`expectMessage`**: Boolean. Should the cancellation modal display the static warning message about inventory restock?

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
