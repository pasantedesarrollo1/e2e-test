import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/auth.js";
import { getElectronicInvoicingAuthType } from "../../../../harness/seed.js";
import { searchReceivableAccount } from "../payments/multiple-payment/herness/multiple-receivables-flow.js";
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

  test("Should properly send 0.01 amount to printer without locale issues", async ({ page }) => {
    test.setTimeout(60_000); 

    await test.step("Navigate to receivables list route", async () => {
      await ensureAuthenticated(page, { 
        tenantBaseUrl, 
        targetPath: "/admin/receivables/list", 
        authType: authType001 
      });
    });

    await test.step("Search for the customer", async () => {
      await searchReceivableAccount(page, "0000000001");
    });
    
    await test.step("Click 'Agregar Abono' action", async () => {
      const firstRow = page.locator(".v-data-table__tr").first();
      await expect(firstRow).toBeVisible({ timeout: 15_000 });
      // The tooltip is 'Agregar Abono' based on the ticket description
      await clickTableRowAction(page, firstRow, "Agregar Abono");
    });

    await test.step("Fill payment details and intercept requests", async () => {
      // "llenar la descripcion: Agrega una Descripción al Abono"
      const descriptionInput = page.getByPlaceholder("Agrega una Descripción al Abono");
      await expect(descriptionInput).toBeVisible();
      await descriptionInput.fill("Prueba monto 0.01");

      // Select EFECTIVO payment method
      const efectivoOption = page.getByText(/^EFECTIVO$/i).first();
      await expect(efectivoOption).toBeVisible();
      await efectivoOption.click();

      // "en el resumen de pago en el metodo de pago que seleccione poner 0,01 ; debe ir con la "coma""
      // Based on Vue: <v-text-field placeholder="Cantidad" ... />
      const amountInput = page.getByPlaceholder("Cantidad");
      await expect(amountInput).toBeVisible();
      await amountInput.click();
      await amountInput.fill("0.01");
      await amountInput.press("Tab");

      const pagarBtn = page.getByRole("button", { name: /^Pagar$/i, exact: true });
      await expect(pagarBtn).toBeEnabled();

      // Intercept the two POST requests
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
      // The user wants to check that the amount sent to the printer is 0.01
      // "comprobar en object.md que los amount sean 3.33 en este ejemplo pero es dinamico, hay que comprobar que en todos sea el mismo valor... que valida hasta antes de llegar a los 0"
      expect(postData.data.amount).toBe(0.01);
      // Wait, in the example the amount is a number 3.33 in the JSON `{"data":{"id":"...","amount":3.33,...`
    });
  });
});
