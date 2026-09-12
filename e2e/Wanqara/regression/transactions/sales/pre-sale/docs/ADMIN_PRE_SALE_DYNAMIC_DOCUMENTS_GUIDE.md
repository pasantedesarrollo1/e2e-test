# Admin Pre-Sale Dynamic Documents Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Pre-Sale Dynamic Documents.

**For AI Agents:** This test is specifically tailored to verify that the **Document Type** dropdown dynamically updates its available options based on the **Subsidiary** (Sucursal) currently selected in the UI *during a Pre-sale*. Subsidiaries with electronic invoicing enabled should show `Factura electrónica`, while those without it should fallback to `Recibos`.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/admin-dynamic-documents-helpers.js` and `harness/admin-document-helpers.js`.
*   `switchAdminSubsidiary`: Interacts with the subsidiary dropdown to change the current context.
*   `waitForFormDefaults`: Ensures that the form fields (Subsidiary, Warehouse, Document Type) are completely loaded.
*   `getAvailableDocumentOptions`: Extracts the list of available text options from the Document Type dropdown safely.

### B. The Orchestrators (Specs)
*   `admin-pre-sale-dynamic-documents.spec.js`: Feeds the JSON contract into the orchestrator logic. It drives the browser to execute a sequence of context switches defined in the `steps` array.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-pre-sale-dynamic-documents.json`
*   **`targetPath`**: The URL to start the test (`"/admin/pre-sale/add"`).
*   **`steps`**: An array of sequential interactions mirroring exactly how it's done for Standard Sales.
    *   **`subsidiaryCode`**: The code of the subsidiary to switch to ("001" vs "100").
    *   **`expectedDefault`**: The string expected to be automatically selected (e.g., "Factura electrónica").
    *   **`expectElectronicOption`**: Boolean asserting whether electronic invoice options should be present in the dropdown list.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
