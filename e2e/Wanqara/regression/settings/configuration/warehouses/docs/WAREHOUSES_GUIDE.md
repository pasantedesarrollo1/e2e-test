# Warehouses Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Settings / Warehouses.

**For AI Agents:** This domain covers standard CRUD operations focusing on creating and deleting warehouse (Bodega) entities.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/warehouses-helpers.js`. 
*   `createWarehouse`: Fills out the form (`name`, `code`, `address`, `description`) and intercepts the `POST` response.

The test relies heavily on the globally shared `deleteRecordFromList` helper from `harness/helpers/crud-helpers.js` to ensure the list is clean before creating and that the entity can be successfully deleted afterward.

### B. The Orchestrators (Specs)
The logic is cleanly divided into atomic execution blocks inside:
*   `warehouses-crud.spec.js`: Iterates over the JSON and executes the Clean -> Create -> Delete flow across various authorization contexts.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/warehouses-crud.json`
*   **`warehouseData`**:
    *   **`name`**: The warehouse name.
    *   **`code`**: The warehouse identifier code.
    *   **`address`**: Warehouse physical address.
    *   **`description`**: Additional details.

The JSON configuration arrays test executions across the `authType` variants (Retail, Dispatch, Restaurant).

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
