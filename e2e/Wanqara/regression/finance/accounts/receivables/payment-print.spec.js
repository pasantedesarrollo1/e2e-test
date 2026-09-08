import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/auth.js";
import { SEED, getElectronicInvoicingAuthType } from "../../../../harness/seed.js";
import { searchReceivableAccount, fillSingleReceivablePayment } from "../payments/multiple-payment/herness/multiple-receivables-flow.js";
import { clickTableRowAction } from "../../../../harness/crud-helpers.js";

const TICKET = {
  ws: '',
  tes: 'TES-215',
  release: 'v7.10.0',
  summary: 'Admin Payments Receivables Amount Print Issue',
  addedToRegression: 'true',
};

const tenantBaseUrl = getTenantBaseUrl();
const authType001 = getElectronicInvoicingAuthType(); 

test.describe("Admin Payments — Receivables Print Locale Bug @release", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);
  
  test.use({ storageState: getSessionPath(authType001) });

  test("Should properly send SEED amount to printer without locale issues", async ({ page }) => {
    test.setTimeout(60_000); 
    const testAmount = SEED.receivables.paymentAmount;
    const testDescription = SEED.receivables.paymentDescription;

    await test.step("Navigate to receivables list route", async () => {
      await ensureAuthenticated(page, { 
        tenantBaseUrl, 
        targetPath: "/admin/receivables/list", 
        authType: authType001 
      });
    });

    await test.step("Search for the customer", async () => {
      await searchReceivableAccount(page, SEED.clients.test.cedula);
    });
    
    await test.step("Click 'Agregar Abono' action", async () => {
      const firstRow = page.locator(".v-data-table__tr").first();
      await expect(firstRow).toBeVisible({ timeout: 15_000 });
      await clickTableRowAction(page, firstRow, "Agregar Abono");
    });

    await test.step("Fill payment details and intercept requests", async () => {
      const pagarBtn = await fillSingleReceivablePayment(page, {
        amount: testAmount,
        description: testDescription,
        paymentMethodRegex: new RegExp(`^${SEED.paymentMethods.efectivo.label}$`, "i")
      });

      const payPromise = page.waitForResponse(res => 
        res.url().includes('/api/v1/accounting/payments/pay-receivable-account/') && 
        res.status() === 200
      );

      const printerPromise = page.waitForRequest(req => 
        req.url().includes('/receiptPrinter/payment-ticket') && 
        req.method() === 'POST'
      );

      await pagarBtn.click();
      
      await payPromise;
      const printerRequest = await printerPromise;

      const postData = printerRequest.postDataJSON();
      expect(postData.data.amount).toBe(parseFloat(testAmount));
    });
  });
});
