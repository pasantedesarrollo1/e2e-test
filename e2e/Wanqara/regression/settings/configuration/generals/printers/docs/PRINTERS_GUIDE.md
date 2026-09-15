# Printers Version Architecture Guide

## Overview
This directory implements the **Modular Data-Driven Testing (DDT)** architecture applied across the repository for Settings / Printers Version Validation.

**For AI Agents:** This test is highly unique as it reads dynamic DOM data from the Wanqara POS and cross-references it with an external website (GitHub Releases).

---

## 1. Modular "Lego" Architecture

### A. The Legos (Helpers)
Located in `harness/printers-helpers.js`. 
*   `getSuggestedPrinterVersion`: Navigates to `/admin/settings/printers`, locates the OS version text (e.g., `Windows - v1.0.0.0`), and uses Regex to extract strictly the version number. Note that we use a tolerant Regex (`/Windows.*v\d/i`) because the UI text sometimes uses em-dashes `—` which get mangled in CI or terminal environments.
*   `verifyVersionOnGithub`: Navigates to the external GitHub Releases URL and checks that a hyperlink matching the exact version strictly exists in the DOM.

### B. The Orchestrators (Specs)
The logic is smoothly linked inside:
*   `printers-version.spec.js`: Reads the JSON metadata, authenticates, extracts the dynamic version via a `test.step`, and validates it on GitHub in the next step.

---

## 2. The JSON Contract & Co-Location

### Example `0-json-data/printers-version.json`
*   **`printerData`**: Configuration data for this web-scraping workflow.
    *   **`platformPrefix`**: e.g., `"Windows "`. (If a Mac or Linux app is added later, we can add more scenarios to this JSON array to validate those prefixes).
    *   **`githubReleasesUrl`**: The repository releases URL to navigate to.

---

## 3. Controlling Execution (Local Development)

*   **`only: true`**: Focuses execution strictly on this scenario. **Never commit to the main branch.**
*   **`skip: true`**: Bypasses the test entirely. You **must** populate the `skipReason` field.
