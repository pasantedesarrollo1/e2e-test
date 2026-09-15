# Subsidiaries Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Settings / Subsidiaries.

**For AI Agents:** This domain covers standard CRUD operations focusing on creating and deleting branch locations (Sucursales). A critical element is selecting whether the branch is a "Commerce" or "Restaurant", and if it handles "Dispatch".

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/subsidiaries-helpers.js`. 
*   `createSubsidiary`: Encompasses the heavy form filling, waiting for nested dropdowns (Province -> City), and checking the complex switch matrix (Restaurant/Commerce vs Dispatch toggle). It intercepts the `POST` request and approves the final confirmation modal.

The test heavily re-uses the global `deleteRecordFromList` helper from `harness/helpers/crud-helpers.js` to ensure state cleanliness.

### B. The Orchestrators (Specs)
The logic is cleanly divided into atomic execution blocks inside:
*   `subsidiaries-crud.spec.js`: Iterates over the JSON and executes the Clean -> Create -> Delete flow.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/subsidiaries-crud.json`
*   **`subsidiaryData`**: Contains the parameters for branch creation.
    *   **`type`**: Used only for the test title description (e.g. `Comercios (Sin Despacho)`).
    *   **`name`**: The name of the branch to create and later delete.
    *   **`code`**: The branch code.
    *   **`isRestaurant`**: Boolean driving the UI click (`Restaurante` vs `Comercios`).
    *   **`hasDispatch`**: Boolean driving the UI `.v-switch` for dispatch.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
