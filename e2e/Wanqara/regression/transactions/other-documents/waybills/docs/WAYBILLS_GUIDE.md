# Waybills Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Transactions / Other Documents / Waybills (Guías de Remisión).

**For AI Agents:** This domain tests the creation of Internal and External Waybills. Waybills depend heavily on prior transactions (like Sales or Transfers).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/waybill-helpers.js`. 
*   `fillExternalWaybillForm`, `fillVehiclePlate`, `assignCarrier`, `fillAddressDetails`, `selectFirstAvailableShipmentProductFromSale`, `fillShipmentAmount`, `submitWaybillAndVerify`: These helpers cover every stage of the waybill wizard.
*   **Carrier Assignment**: The `assignCarrier` helper iterates through 3 different methods of assigning a carrier: searching by "cedula", picking from the "selector" dropdown, or filling out a "form" manually.

### B. The Orchestrators (Specs)
*   `waybill-external.spec.js`: Iterates over `waybill-external.json` to execute variations of the External Waybill creation. In the second scenario, it dynamically spins up an admin sale using the shared `runAdminSaleFlow` helper from the `sales` module, proving cross-module interoperability.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/waybill-external.json`
*   **`waybillData`**:
    *   **`checkoutName`**: Box/Session name needed to find the sale.
    *   **`vehiclePlate`**, **`address`**, **`reason`**, **`route`**: Form filling variables.
    *   **`isLongProductSale`**: Boolean. When true, the test intercepts and builds an entirely new Factura Electrónica containing a product with a massive name to test UI wrapping and PDF generation boundaries.
    *   **`saleParams`**: Parameters passed to `runAdminSaleFlow` if a sale needs to be created dynamically.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
