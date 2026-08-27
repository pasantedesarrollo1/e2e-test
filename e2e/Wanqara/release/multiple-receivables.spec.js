import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../harness/auth.js";
import { getElectronicInvoicingAuthType } from "../harness/seed.js";
import {
  selectClientAndAccounts,
  fillPaymentDetailsAndSubmit,
  validateInitialDeletionError,
  navigateToSettlementDetails,
  generateAndViewPDF,
  confirmFinalDeletion
} from "./herness/multiple-receivables-flow.js";

const tenantBaseUrl = getTenantBaseUrl();
const authType001 = getElectronicInvoicingAuthType(); 

test.describe("Admin Payments — Multiple Receivables @release", () => {
  test.skip(true, "Skipped in develop: Feature WS-840 belongs to an unmerged branch.");
  requirePosCredentials(test);
  
  test.use({ storageState: getSessionPath(authType001) });

  test("Completes multiple receivables flow (Payment, PDF view, Deletion)", async ({ page }) => {
    test.setTimeout(180_000); 

    await test.step("Navigate to multiple receivables route", async () => {
      await ensureAuthenticated(page, { 
        tenantBaseUrl, 
        targetPath: "/admin/payments/add/multiple-receivables", 
        authType: authType001 
      });
    });

    await test.step("Create the payment with multiple accounts", async () => {
      await selectClientAndAccounts(page);
      await fillPaymentDetailsAndSubmit(page);
    });

    await test.step("Attempt to delete payment and verify error", async () => {
      await validateInitialDeletionError(page);
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
      await confirmFinalDeletion(page);
    });
  });
});