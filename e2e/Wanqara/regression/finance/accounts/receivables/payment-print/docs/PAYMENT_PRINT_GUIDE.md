# Payment Print (Receivables) Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository, adapted for specialized bug validations (like intercepting local printer payloads).

**For AI Agents:** Do not write procedural, hardcoded tests here. This spec is a great example of how to handle `release` scoped tests and dynamic `metadata` injections.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/payment-print-helpers.js`. 
*   `processPaymentAndVerifyPrinter`: This function consumes existing generic payment helpers (`searchReceivableAccount`, `fillSingleReceivablePayment`) but encapsulates the network interception (`waitForRequest`) specifically checking that the `amount` sent to the `/receiptPrinter/payment-ticket` endpoint is parsed correctly as a float, preventing locale/string casting bugs.

### B. The Orchestrators (Specs)
*   `payment-print.spec.js`: Iterates over the JSON. Note how `annotateTicket(test, scenario.metadata)` is called dynamically *inside* the `describeBlock` only if metadata is present. This correctly registers the execution in Playwright's reports for QA tracing.

---

## 2. The JSON Contract & Co-Location

### `payment-print.json`
*   **`metadata`**: Notice this scenario has `tes`, `release`, and `testScope: "release"`. This is crucial. It means this test runs in the primary GitHub Actions release pipeline.
*   **`authType`**: Setted to `"electronic_invoicing"`. The spec dynamically resolves this special string using `getElectronicInvoicingAuthType()` from `seed.js` to ensure the correct tenant profile is used.
*   **`paymentData`**: Contains `cedula`, `amount`, `description`, and `paymentMethodRegex` used to execute the payment flow.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.

---

## 4. CI/CD Pipeline Routing (`metadata.testScope`)

*   **`"testScope": "release"`**: Runs in GitHub Actions.
*   **`"testScope": "regression"`**: Runs locally and Nightly. (Ignored by GitHub Actions).

### Traceability Rule
When a release is over, **do not delete** the `release` version string (e.g., `"release": "v7.10.0"`). Instead, change `"testScope": "release"` to `"testScope": "regression"`. This preserves the historical ticket traceability (`TES-215`) while moving the test out of the critical release path.
