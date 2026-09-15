# Admin Pre-Sale Documents Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Pre-Sale Documents.

**For AI Agents:** This test suite verifies the core behavior of creating administrative pre-sales under different document types, specifically verifying **Electronic Invoices** (Facturas electrónicas) and standard internal **Receipts** (Recibos).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
*   `harness/admin-pre-sale-flow.js`: Contains `runAdminPreSaleFlow` which handles the logic to build and submit a pre-sale document. Unlike sales, pre-sales hit the `/api/v2/billing/pre-sales` endpoint and bypass immediate payment processing in some configurations.

### B. The Orchestrators (Specs)
*   `admin-pre-sale-documents.spec.js`: Iterates over the JSON payload, injecting the dynamically assigned business contexts and document formats.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-pre-sale-documents.json`
*   **`authType`**: Dictates the business context ("restaurant" vs "retail"). Restaurant in this test data represents a subsidiary configured with electronic invoicing capabilities.
*   **`saleParams`**:
    *   **`documentType`**: Explicit text passed to the document selection modal (e.g., "Factura electrónica" vs "Recibos").
    *   **`productName`**: The product to test the pre-sale flow against.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
