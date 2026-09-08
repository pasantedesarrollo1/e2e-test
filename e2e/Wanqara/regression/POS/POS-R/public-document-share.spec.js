import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/auth.js";
import { expectSnackbar } from "../../../harness/ui-helpers.js";
import { selectClientByCedula } from "../harness/pos-sale-flow.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { completePayment } from "../harness/pos-payment.js";
import { SEED } from "../../../harness/seed.js";

const TICKET = {
  ws: 'WS-995',
  tes: 'TES-214',
  release: 'v7.9.0',
  summary: 'Compartición de Facturas y Cotizaciones vía WhatsApp en POS',
  addedToRegression: 'true',
};

test.describe(`POS Retail — Public Document Share @release`, () => {
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath('retail') });

  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  test("validates tokenization via share-token API, clipboard flow, public view and error state", async ({ posPage: page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    let publicToken = null;
    let shareUrl = null;

    await test.step("Navigate to POS and setup", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home" });
      await page.waitForURL(/\/pos\/home/);
    });

    await test.step("Search and select product", async () => {
      await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
    });

    await test.step("Search and select client", async () => {
      await selectClientByCedula(page, SEED.clients.test.cedula, { snackbarRequired: true });
    });

    await test.step("Proceed to payment and finish sale", async () => {
      await page.getByRole('button', { name: /Terminar Venta/i }).click();
      await page.waitForURL(/\/pos\/(restaurant-)?payments/);

      await completePayment(page, { 
        paymentMethod: SEED.paymentMethods.efectivo, 
        printTicket: false,
        viewPdf: true,
        openDrawer: false 
      });
    });

    await test.step("Generate public link via Copiar enlace", async () => {
      const copyLinkBtn = page.getByRole('button', { name: /Copiar enlace/i });
      await expect(copyLinkBtn).toBeVisible({ timeout: 15000 });

      const responsePromise = page.waitForResponse(res => 
        res.url().includes('/api/v1/billing/documents/share-token') && 
        res.request().method() === 'POST' && 
        res.status() === 200
      );

      await copyLinkBtn.click();

      const response = await responsePromise;
      const responseBody = await response.json();
      
      publicToken = responseBody.token;
      
      expect(publicToken).toBeDefined();
      
      // Verify clipboard content
      const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
      const clipboardText = await handle.jsonValue();
      
      // The frontend builds a public frontend URL instead of using the raw API url
      expect(clipboardText).toContain(publicToken);
      
      // Update shareUrl to the actual clipboard text so we can navigate to it
      shareUrl = clipboardText;
    });

    await test.step("Validate Public View Access Control (Invalid Token)", async () => {
      const context = page.context();
      const mobilePage = await context.newPage();
      
      // Replace valid token with invalid one in the shareUrl
      const invalidToken = 'INVALID_TOKEN_12345';
      const invalidUrl = shareUrl.replace(publicToken, invalidToken);

      const publicApiPromise = mobilePage.waitForResponse(res => 
        (res.url().includes(`/api/v1/public/documents/${invalidToken}`) || res.url().includes(`/api/v1/get-document/${invalidToken}`)) && 
        res.status() === 404
      );

      await mobilePage.goto(invalidUrl);
      await publicApiPromise;

      // Verify Error State is rendered
      const errorIcon = mobilePage.locator('.mdi-alert-circle').first();
      await expect(errorIcon).toBeVisible({ timeout: 10000 });

      await mobilePage.close();
    });
  });
});
