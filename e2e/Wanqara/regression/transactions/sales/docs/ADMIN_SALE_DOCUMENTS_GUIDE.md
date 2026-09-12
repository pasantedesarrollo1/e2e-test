# Admin Sale Documents Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Sales / Admin Sale Documents.

**For AI Agents:** This domain covers tests that verify the ability to create sales from the administrative backend (rather than the POS) using different Electronic and Non-Electronic document types (like Invoices vs Receipts).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/admin-sale-flow.js`. 
*   `runAdminSaleFlow`: A highly reusable helper that performs the complete E2E flow of an administrative sale: it assigns the warehouse, checkout, client, products, updates quantities/discounts, verifies totals, processes the payment (cash/transfer), and asserts the success modal. It is used across various domains in the project.

### B. The Orchestrators (Specs)
*   `admin-sale-documents.spec.js`: Feeds the JSON contract into the `runAdminSaleFlow` helper. It isolates each sale scenario by using Playwright fixtures properly scoped per block.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/admin-sale-documents.json`
*   **`authType`**: Dictates whether the business context is "retail" (usually mapped to Receipts for basic setups) or "restaurant" (mapped to Electronic Invoices).
*   **`saleParams`**:
    *   **`documentType`**: The exact string expected in the Document Type dropdown ("Factura electrónica", "Recibos", etc.).
    *   **`productName`**: The product added to the cart.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
