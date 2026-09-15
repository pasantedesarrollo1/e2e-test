# Orders Reconciliations Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Special Modules / Restaurants / Orders Reconciliations (Cuadre de Caja).

**For AI Agents:** This domain covers tests related to the Reconciliations list for orders inside a restaurant environment. The current scenario tests the **Waiter Filter** functionality from the advanced search interface.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/restaurant-helpers.js` at the `restaurants` root module level, because the advanced search by waiter is an interface shared heavily across multiple views in the restaurants module (e.g. Orders and Orders Reconciliations).
*   `filterByWaiter`: Automates the UI interaction with the advanced search popup, searches for the user, triggers the backend query (`/api/v1/general/users`), selects the target, applies the filter, and validates the intercepted data endpoint (e.g. `/api/v1/inventory/reconciliations/orders`).

### B. The Orchestrators (Specs)
*   `orders-reconciliations-waiter-filter.spec.js`: Feeds the JSON contract into the generic shared helper.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/orders-reconciliations-waiter-filter.json`
*   **`filterData`**:
    *   **`waiterName`**: Exact name of the waiter expected in the system.
    *   **`searchKeyword`**: The typed keyword.
    *   **`apiEndpointPattern`**: The specific API endpoint for the reconciliations list which differentiates it from the standard orders list.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
