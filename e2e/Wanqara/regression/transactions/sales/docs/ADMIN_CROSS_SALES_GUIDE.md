# Admin Cross Sales Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Cross Sales.

**For AI Agents:** This test suite verifies the **Anti-Cross Validation** mechanism. In multi-branch architectures, it is critical that users can only bill from Warehouses (Bodegas) and Checkouts (Cajas) that belong to their currently selected Subsidiary (Sucursal). This spec switches the context dynamically across all branches and attempts to perform both **Sales** and **Presales** using the valid combinations for each context to guarantee zero crossover.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/admin-cross-sale-flow.js`.
*   `selectCustomCheckout`: Overrides the standard `runAdminSaleFlow` selection logic to force selecting specific, parameterized Warehouses and Checkouts.
*   `submitValidatedAdminTransaction`: Triggers the transaction submission and strictly verifies that the network response matches the expected endpoint (`/api/v2/billing/sales` vs `/api/v2/billing/pre-sales`).
*   *(Note: This uses isolated versions of the checkout/payment methods because it validates the raw form states before standard helpers take over).*

### B. The Orchestrators (Specs)
*   `admin-cross-sales.spec.js`: Feeds the JSON contract into the orchestrator logic. Iterates through every subsidiary and its respective warehouse-checkout pairs.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-cross-sales.json`
*   **`transaction`**: Defines the `path` (UI URL to visit) and the `endpoint` (API route to wait for) for the current transaction type (Sale vs Presale).
*   **`sucursales`**: The matrix of valid data.
    *   **`name`**: The subsidiary name to switch into.
    *   **`combinations`**: An array of `{ bodega, caja }` objects representing every valid pair available in that subsidiary.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
