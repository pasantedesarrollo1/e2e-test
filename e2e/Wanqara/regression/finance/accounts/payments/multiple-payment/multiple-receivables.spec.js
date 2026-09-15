import { expect, test } from "@playwright/test";
import { annotateTicket } from "../../../../../harness/helpers/reporting/annotate.js";
import { getSessionPath } from "../../../../../harness/helpers/auth/auth.js";
import { requirePosCredentials } from "../../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../../harness/helpers/auth/auth.js";
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

import scenarios from "./0-json-data/multiple-receivables.json" with { type: "json" };

test.describe("Finance - Accounts - Multiple Receivables (E2E)", () => {
  requirePosCredentials(test);

  for (const scenario of scenarios) {
    scenario.metadata = scenario.metadata || { ws: null, testScope: "regression" };
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuración en JSON';
        test(`Omitido: ${razon}`, async () => {});
      });
      continue;
    }

    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const executionTag = `@${scope}`;
    const describeBlock = scenario.only ? test.describe.only : test.describe;

    describeBlock(`Escenario: ${scenario.description} ${executionTag}`, () => {
      
      if (scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }
      
      const resolvedAuthType = scenario.authType;

      test.use({ storageState: getSessionPath(resolvedAuthType) });

      test("Completes multiple receivables flow (Payment, PDF view, Deletion)", async ({ page }) => {
        test.setTimeout(180_000); 

        await test.step("Navigate to multiple receivables route", async () => {
          await ensureAuthenticated(page, { 
            targetPath: "/admin/payments/add/multiple-receivables", 
            authType: resolvedAuthType 
          });
        });

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
  }
});