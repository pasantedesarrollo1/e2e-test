# Subscriptions Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Settings / Subscriptions Overview.

**For AI Agents:** This domain covers validation of Subscription Modules and Capability Badges against expected values defined in the configuration JSON.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/subscriptions-helpers.js`. 
*   `validateSubscriptionsOverview`: Scans the DOM for subscription cards and extracts the short code (e.g., `BN001`). Verifies that the extracted code exists in the `subscriptionData` JSON.
*   `validateSubsidiaryCapabilityBadges`: Navigates to the subsidiary creation form, scans the blue capability badges (e.g., `Suscripción Restaurantes`), and verifies they match either `moduleLabels` or `capabilityLabels` in the JSON.

### B. The Orchestrators (Specs)
The logic is cleanly divided into atomic execution blocks inside:
*   `subscriptions-overview.spec.js`: Reads the JSON and executes both validation flows.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/subscriptions-overview.json`
*   **`subscriptionData`**: Contains the lists of expected plans, modules, receipts, and labels.
    *   **`modules`**: Array of valid module codes (e.g. `[{"code": "BN001"}]`).
    *   **`capabilityLabels`**: Array of valid textual capability badges.
    *   **`moduleLabels`**: Array of valid textual module badges.
By moving these out of the hardcoded `SEED`, you can freely add or remove modules from this JSON array as the tenant's capabilities evolve without modifying the spec.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
