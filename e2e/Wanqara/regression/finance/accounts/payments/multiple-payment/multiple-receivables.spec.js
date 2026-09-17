import { expect, test } from "../../../../../harness/fixtures/admin.fixture.js";
import { generateDataDrivenTests } from "../../../../../harness/helpers/test-generator.js";
import { requirePosCredentials } from "../../../../../harness/config/settings.js";
import { clickTableRowAction } from "../../../../../harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../../harness/helpers/ui/action-tooltips.js";
import {
  confirmFinalDeletion,
  fillPaymentDetailsAndSubmit,
  generateAndViewPDF,
  navigateToSettlementDetails,
  printPaymentTicket,
  searchReceivableAccount,
  selectClientAndAccounts,
  validateInitialDeletionError
} from "./harness/multiple-receivables-helpers.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "multiple-receivables.json"), "utf-8")
);

test.describe("Finance - Accounts - Multiple Receivables (E2E)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {
    
    test.use({ 
      targetPath: "/admin/payments/add/multiple-receivables",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test("Completes multiple receivables flow (Payment, PDF view, Deletion)", async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(180_000); 

      // Ya no necesitamos ensureAuthenticated, el workflow adminContext navega a targetPath asegurando sesión.

      await test.step("Create the payment with multiple accounts", async () => {
        await selectClientAndAccounts(page, scenario.paymentData);
        await fillPaymentDetailsAndSubmit(page, scenario.paymentData);
      });

      await test.step("Search for the payment record", async () => {
        await searchReceivableAccount(page, scenario.paymentData.cedula);
      });

      await test.step("Open account details", async () => {
        const firstRow = page.locator(".v-data-table__tr").first();
        await expect(firstRow).toBeVisible({ timeout: 15_000 });
        await clickTableRowAction(page, firstRow, ACTION_TOOLTIPS.receivableAccounts.view);
        await expect(page.getByText(/Abonos de la cuenta/i).first()).toBeVisible({ timeout: 15_000 });
      });

      await test.step("Print payment ticket and verify amounts (TES-215)", async () => {
        await printPaymentTicket(page, scenario.paymentData);
      });

      await test.step("Attempt to delete payment and verify error", async () => {
        await validateInitialDeletionError(page, scenario.paymentData);
      });

      await test.step("Navigate to settlement details", async () => {
        await navigateToSettlementDetails(page);
      });

      await test.step("Generate and view payment settlement PDF", async () => {
        try {
          await generateAndViewPDF(page);
        } catch (error) {
          expect.soft(false, `Error rendering PDF Viewer: ${error.message}`).toBeTruthy();
          await page.keyboard.press("Escape"); 
        }
      });

      await test.step("Initiate and confirm final deletion", async () => {
        await confirmFinalDeletion(page, scenario.paymentData);
      });
    });

  });
});