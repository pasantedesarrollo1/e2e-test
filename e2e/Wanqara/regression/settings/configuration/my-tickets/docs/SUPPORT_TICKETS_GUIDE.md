# Support Tickets Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Settings / My Tickets / Support Tickets.

**For AI Agents:** This domain covers the flow of Creating a support ticket (selecting services, dates, and times inside dialogues) and Searching for an existing ticket.

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/support-tickets-helpers.js`. 
*   `navigateToCreateTicket`, `selectFirstCategory`, `clickSiguiente`, `selectFirstService`, `selectFirstDateAndSlot`, `fillWhatsapp`, `fillObservation`, `acceptTerms`, `checkFormFilledCorrectly`: These granular helper functions interact with the creation wizard. The `selectFirstDateAndSlot` handles complex logic to avoid weekends and select the first available timeslot.
*   The Search flow relies on the global `searchInList` helper combined with API interception.

### B. The Orchestrators (Specs)
The logic is cleanly divided into atomic execution blocks inside:
*   `support-tickets.spec.js`: Reads the JSON and executes both the `Create` and `Search` flows.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/support-tickets.json`
*   **`ticketData`**:
    *   **`searchId`**: The ticket code to search for (e.g., `"17902"`).
    *   **`whatsapp`**: Data used to fill the creation form (e.g., `"999999999"`).
    *   **`observation`**: The observation string (e.g., `"test automatizado"`).

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
