# Dispatch Types Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Settings / Dispatch Types (Tipos de Despacho).

**For AI Agents:** This domain covers standard CRUD operations but includes a domain-specific "Toggle" behavior for Deactivating and Activating the Dispatch Type, which involves opening the edit form and clicking a switch (`.v-switch`).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/dispatch-types-helpers.js`. 
*   `createDispatchType`: Navigates to `/admin/dispatch-types/add`, fills the form (name, type, description) and saves.
*   `toggleDispatchTypeState`: Navigates to the list, finds the dispatch type, clicks edit, toggles the state via the `.v-switch`, and saves. Used for both activating and deactivating.

### B. The Orchestrators (Specs)
The logic is integrated into an execution block:
*   `dispatch-types.spec.js`: Full end-to-end integration flow. Creates -> Deactivates -> Activates.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/dispatch-types-crud.json`
*   **`dispatchData`**: Contains the entity details.
    *   **`name`**: Name of the dispatch type.
    *   **`type`**: Type string that will be converted into Regex for dropdown selection (e.g. `"Local"`).
    *   **`description`**: Detailed description.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
