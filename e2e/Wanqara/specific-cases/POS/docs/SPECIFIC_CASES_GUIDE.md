# Specific Cases (Developer Sandbox) Architecture Guide

## Overview
The `specific-cases` directory is designed to hold highly specialized, ticket-specific edge cases (e.g., fractional rounding errors, extreme edge-case combos). 

**For AI Agents and Developers:** This directory is your **Sandbox**. While it structurally mimics the `regression` directory (e.g., `specific-cases/POS`, `specific-cases/transactions`), it exists independently so that developers can aggressively mutate test configurations for hotfixes without polluting or accidentally breaking the core CI/CD regression suite.

---

## 1. Modular Data-Driven Architecture (Inherited)

Even though this is a sandbox, it strictly adheres to the **Modular DDT Pattern** used in `regression`.

### A. The Legos (Helpers)
Do **not** duplicate helper functions. If you need a helper (like `searchAndSelectProduct` or `runAdminSaleFlow`), import it directly from the `regression/` directory. The `specific-cases` orchestrators simply consume the existing regression building blocks.

### B. The Orchestrators (Specs)
The `.spec.js` files reside inside their respective domain folders (e.g., `specific-cases/POS/rounding-error.spec.js`). They dynamically execute tests based on the JSON payload. Note how `rounding-error.spec.js` can dynamically switch between `posPage` and `posRestaurantPage` fixtures based on the JSON contract.

---

## 2. The JSON Contract & Test Scopes

JSON files are stored in `0-json-data/` within their respective domain folders.

### `testScope` Metadata Tagging
Because specific cases often reproduce bugs reported in production, they usually belong to the **Release** verification phase rather than the standard nightly regression. 
*   Always define `"testScope": "release"` or `"testScope": "specific"` in your JSON metadata.
*   This allows the CI/CD pipeline to target these specific edge cases via `--grep "@release"` when launching a new version, without bloating the everyday `@regression` suite.

---

## 3. Sandboxing & Local Debugging

When a developer needs to debug a backend fix locally:
1. Locate the specific case JSON (e.g., `specific-cases/POS/0-json-data/rounding-error.json`).
2. Set `"only": true` on the scenario they wish to test.
3. Run the test locally. Playwright will focus exclusively on that JSON block.
4. Because this occurs in `specific-cases`, accidental commits of `"only": true` are less dangerous than if they occurred in the core regression JSON, although it should still be avoided.
