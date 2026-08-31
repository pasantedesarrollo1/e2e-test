# WS-1025 — POS Cart Duplication

**File:** `e2e/Wanqara/release/ws-1025-cart-duplication.spec.js`
**Suite:** Release (`@release`)
**Playwright project:** `Release` — `storageState: retail-session.json`
**Scope:** POS Comercios (retail, branch 100). Restaurant POS is out of scope for this spec.
**Tenant precondition:** `1792780241001`

---

## What is being tested

The POS cart must increment the quantity of an existing line item when the same product is added again through any input mechanism. It must never create a duplicate line item for the same product.

The implementation exposes a browser console warning `[Duplication] Adding Product to Detail` when `addProductToDetail` is called more than once for a product already in the cart instead of incrementing its quantity. Every flow in this spec asserts that warning is absent after each interaction.

---

## Product under test

`SEED.products.estandar` — `"Caja de alitas de pollo (100 u)"`, code `Caj000000001`.

---

## Input mechanisms covered

| Mechanism | Helper | Description |
|---|---|---|
| Barcode scanner / code search | `searchByCode` | Fills `#searchInput` in code mode and presses Enter |
| Catalog card click | `clickCard` | Switches to name mode, searches, clicks the `.v-card` |
| Cart `+` button | `clickCartPlus` | Clicks the increment button inside the cart line item |
| Cart `−` button | `clickCartMinus` | Clicks the decrement button inside the cart line item |
| Cart quantity input | `setCartManualAmount` | Directly fills the `input[inputmode='decimal']` inside the cart line item |
| Catalog badge `+` | `clickCardBadgePlus` | Clicks the `+` button on the floating badge overlay of the product card (visible when product is already in cart) |

All catalog-side helpers (`searchByCode`, `clickCard`, `clickCardBadgePlus`) accept a `{ fast: true }` flag that removes artificial `waitForTimeout` delays, used to simulate rapid user input or scanner bursts.

---

## Cart item selector

The cart panel renders each line item as `div.tw-border-l-2.tw-border-secondary`. All cart-scoped helpers anchor to this element filtered by product name via `getCartItem(page, name)`, ensuring isolation when multiple products are present.

---

## Assertion model

`assertCartState(page, expectedQuantity)` performs two checks on every call:

1. The cart line item for the product is visible and its quantity input holds exactly `expectedQuantity`.
2. No `[Duplication]` warning has been captured in the console since the last `clearCart` or `beforeEach` reset.

---

## Flows

### Flow 1 — Scanner and interface iteration
**Sequence:** `searchByCode` → `clickCard` → `clickCartPlus` → `searchByCode`
**Expected quantities after each step:** 1 → 2 → 3 → 4

Verifies that mixing the scanner mechanism with a direct card click and then the in-cart increment button all converge on a single line item with the correct accumulated quantity.

---

### Flow 2 — Manual override and increments
**Sequence:** `clickCard` → `setCartManualAmount(5)` → `clickCardBadgePlus` → `searchByCode`
**Expected quantities:** 1 → 5 → 6 → 7

Verifies that manually typing a quantity into the cart input establishes the correct baseline, and that subsequent additions via the badge and scanner continue incrementing from that value without resetting or duplicating.

---

### Flow 3 — Chaos of sums and subtractions
**Sequence:** `clickCard` → `clickCardBadgePlus` → `clickCartMinus` → `setCartManualAmount(10)` → `clickCard`
**Expected quantities:** 1 → 2 → 1 → 10 → 11

Verifies that decrement and manual override interact correctly with subsequent additions, including a large manual jump followed by a card click.

---

### Flow 4 — Rapid fire codes
**Sequence:** `searchByCode` → `searchByCode` → `clickCardBadgePlus` → `searchByCode`
**Expected quantities:** 1 → 2 → 3 → 4

Verifies repeated scanner scans with standard delays interleaved with a badge click all accumulate correctly.

---

### Flow 5 — Consecutive scans without delay (scanner race condition)
**Sequence:** `searchByCode({ fast })` × 3
**Expected quantities:** 1 → 2 → 3

Removes all artificial delays between scans to simulate a physical barcode scanner firing multiple reads in rapid succession. The scanner path sends `amount: 0` to the add-product handler, making it specifically susceptible to a double-invocation race. Verifies the handler is called once per scan, not twice.

---

### Flow 6 — Double-click on badge (rapid badge race condition)
**Sequence:** `clickCard` → `clickCardBadgePlus({ fast })` → `clickCardBadgePlus({ fast })`
**Expected quantities:** 1 → (2, 3 asserted together after both clicks) → 3

Removes delays between two consecutive badge clicks to exercise the badge increment handler under rapid user input. Asserts quantity is 3 (not 4 or any value that would indicate a duplicate add) and that no duplication warning fired.

---

### Flow 7 — Double-click on product card (rapid card tap)
**Sequence:** `clickCard({ fast })` → `clickCard({ fast })`
**Expected quantities:** 1 → 2

Removes delays between two card clicks to simulate a user double-tapping the product card before the UI processes the first tap. Verifies the second tap increments the existing item rather than invoking the add handler twice.

---

### Flow 8 — Manual amount set to 0, then re-add via card
**Sequence:** `clickCard` → `setCartManualAmount(0)` → `clickCard`
**Expected quantities:** 1 → (0, no assertion) → 1

Verifies that setting quantity to 0 manually and then re-adding the product from the catalog results in a single line item with quantity 1, without duplication or stale state from the zeroed-out entry.

---

### Flow 9 — Scanner then badge plus, alternating mechanisms
**Sequence:** `searchByCode` → `clickCardBadgePlus` → `searchByCode({ fast })` → `clickCardBadgePlus({ fast })`
**Expected quantities:** 1 → 2 → 3 → 4

Alternates between the scanner and the badge mechanisms, mixing normal and fast modes, to verify that both addition paths share the same cart state correctly across multiple calls.

---

## Coverage matrix

| Flow | searchByCode | clickCard | clickCartPlus | clickCartMinus | setCartManualAmount | clickCardBadgePlus | fast (no delay) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | ✓ | ✓ | ✓ | | | | |
| 2 | ✓ | ✓ | | | ✓ | ✓ | |
| 3 | | ✓ | | ✓ | ✓ | ✓ | |
| 4 | ✓ | | | | | ✓ | |
| 5 | ✓ | | | | | | ✓ |
| 6 | | ✓ | | | | ✓ | ✓ |
| 7 | | ✓ | | | | | ✓ |
| 8 | | ✓ | | | ✓ | | |
| 9 | ✓ | | | | | ✓ | ✓ |