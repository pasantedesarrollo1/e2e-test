# Implementation Evidence: TES-214 - Extra Category Creation Test Implementation

## 1. Execution Result
- **Status:** PASS 🟢
- **Scope Covered (Frontend UI):** 
  - **Case 1 (Successful Flow):** Verified the successful creation of a restaurant order using a base product associated with a valid, in-stock extra. The order is submitted from the Chef (Waiter) interface, and the payment is successfully collected in the POS Restaurant interface.
  - **Case 4 (Insufficient Stock):** Verified that the modifiers modal correctly blocks adding an extra when its stock is 0. It visually displays "Sin stock disponible" and triggers a warning toast ("No hay stock disponible para este acompañamiento") rather than allowing selection.

*(Note: Payload validation, invalid UUIDs, and 403 permission cases correspond to backend/integration layers and are outside the scope of this UI E2E test).*

## 2. Modified / Created Files
**Seeds (Test Data Management):**
- `e2e/Wanqara/harness/seeds/extras-seed.js` (Centralized names, categories, and UI texts to avoid hardcoding).
- `e2e/Wanqara/harness/seed.js` (Integrated `extras-seed.js` into the global SEED).

**Admin (CRUD & Associations):**
- `e2e/Wanqara/regression/Admin/Admin-C/extra-categories.spec.js` (Separated tests into serial steps to isolate creation vs. association failures).
- `e2e/Wanqara/regression/Admin/Admin-C/harness/extras-crud-helpers.js`
- `e2e/Wanqara/regression/Admin/Admin-C/harness/extras-by-product-helpers.js`

**Restaurant POS (Chef -> POS Sales Flow):**
- `e2e/Wanqara/regression/POS/POS-R/order-with-extras.spec.js` (Main suite for waiter/chef adding extras and cashier collecting payment).
- `e2e/Wanqara/regression/POS/POS-R/harness/pos-extras-helpers.js` (Helpers to interact with the Ionic modals in the Waiter frontend).
- `e2e/Wanqara/regression/POS/POS-R/harness/pos-orders-common.js` (Fixed the "Cobrar" button locator to ensure compatibility with the current UI).

## 3. Implementation Strategy & Context (For Future AI Agents & Engineers)

**Extras Flow Context:**
Wanqara uses a distinct flow for "Restaurants" (POS-R). Waiters use a specialized view ("Chef" / `pos-meseros`) built with Ionic/Vue (Shadow DOM), meaning standard Vuetify locators do not apply here.
For this ticket, the complete lifecycle of "Extras" was implemented:
1.  **Backoffice (Admin-C):** Created the category, the extra item itself, and associated the extra with a main product (CRUD operations). 
2.  **Chef Frontend:** The waiter selects the table, chooses the main product, and opens the modifiers sheet (`ExtrasSelectionSheet.vue`). Locators here rely heavily on `data-testid` (e.g., `product-extras-open-0`, `product-extra-increment`) since Ionic's Shadow DOM complicates traditional queries.
3.  **POS Frontend:** Once the order is submitted by the waiter, the cashier logs into the traditional POS (Vuetify), searches for the pending table, and collects the payment. 

**Handling Complex UI Elements:**
- **Buttons Blocked by Overlays (Ionic):** The increment button for out-of-stock extras is covered by an absolute layer (`.absolute.inset-0.z-10`) that intercepts clicks to trigger the toast. We used `force: true` on the wrapper to successfully fire the `@click` event.
- **Strict Mode Violations:** Adjusted the "Agregar" and "Cobrar" button selectors by using strict filtering via testIds (`product-modal-confirm`) or chaining `.filter({ hasText: ... })`. This was necessary because multiple buttons with similar text labels are mounted in the DOM simultaneously.
- **State Cleanup:** To prevent the POS test from interacting with residual orders from previous test runs, a call to `closeAllActiveOrders` was injected before initiating the Chef view flow.

## 4. Source Code Reference
*No code snippets are attached per explicit request. Please review the file paths listed in Section 2 to consult the implemented helpers and flows.*
