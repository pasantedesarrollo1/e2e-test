# Orders Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Special Modules / Restaurants / Orders.

**For AI Agents:** This domain covers tests related to the Orders list inside a restaurant environment. The current scenario tests the **Waiter Filter** using the advanced search popup, which relies heavily on backend queries to resolve staff users and filter the datatable.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/orders-helpers.js`. 
*   `filterByWaiter`: Clicks the advanced search, selects the "Mesero" chip, opens the user search dialog, searches using a keyword, selects the waiter, applies the filter, and validates that the Orders table remains visible (implicitly confirming the API returned a 200 OK and didn't crash).

### B. The Orchestrators (Specs)
*   `orders-waiter-filter.spec.js`: Interacts with the `0-json-data` contract to inject the waiter names. It splits execution into clean steps: Navigation -> Advanced Filter Execution.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/orders-waiter-filter.json`
*   **`filterData`**:
    *   **`waiterName`**: Exact name of the waiter expected in the system.
    *   **`searchKeyword`**: Shorthand used to trigger the autocomplete API.
    *   **`apiEndpointPattern`**: The orders API to intercept (`/api/v1/restaurant/orders`).

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
