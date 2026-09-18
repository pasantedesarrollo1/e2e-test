/* eslint-disable */
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

import type { MultiplePaymentOptions } from '@/e2e/Wanqara/regression/finance/accounts/payments/multiple-payment/harness/multiple-receivables-helpers.js';
interface ScenarioData extends ScenarioDefinition, TestMetadata {
  subsidiaryName: string;
  subsidiaryCode: string;
  authType: string;
  loginMode: "fresh" | "cached" | "";
  paymentData: any;
}

import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { clickTableRowAction } from "@/e2e/Wanqara/harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/ui/action-tooltips.js";
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

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    
    test.use({ 
      targetPath: "/admin/payments/add/multiple-receivables",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode as any
    });

    test("Completes multiple receivables flow (Payment, PDF view, Deletion)", async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(180_000); 

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
          expect.soft(false, `Error rendering PDF Viewer: ${(error as Error).message}`).toBeTruthy();
          await page.keyboard.press("Escape"); 
        }
      });

      await test.step("Initiate and confirm final deletion", async () => {
        await confirmFinalDeletion(page, scenario.paymentData);
      });
    });

  });
});
