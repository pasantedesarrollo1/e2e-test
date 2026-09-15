# People Management Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for People (Personas/Clientes/Empleados).

**For AI Agents:** This domain covers standard CRUD operations but includes a domain-specific "Delete" behavior known as "Deactivation", which leaves a strikethrough (CSS `line-through`) instead of fully removing the row from the Data Table.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/people-helpers.js`. 
*   `createPerson`: Navigates to `/admin/people/add`, fills the form and saves.
*   `searchPerson`: Navigates to the list and filters by `identity`.
*   `deactivatePerson`: Searches and clicks the trash icon to trigger deactivation via API.
*   `verifyDeactivatedStrikethrough`: Clears search, re-searches, and asserts `text-decoration-line: line-through`.

### B. The Orchestrators (Specs)
The logic is cleanly divided into atomic execution blocks:
*   `people-create.spec.js`: Only creates records.
*   `people-search.spec.js`: Precondition (Creates) -> Searches.
*   `people-delete.spec.js`: Precondition (Creates) -> Deactivates -> Verifies Strikethrough.
*   `people-crud.spec.js`: Full end-to-end integration flow of all the above.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/people-create.json`
*   **`personData`**: Contains the entity details.
    *   **`name`**: Full name of the user.
    *   **`identity`**: ID number (Cedula/RUC).
    *   **`identityType`**: "CEDULA" or "RUC".
    *   **`roles`**: Array of Regex strings (e.g., `["^Cliente$"]`, `["^Empleado$"]`). The `RegExp` object is reconstituted in the helper function.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
