import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTenantBaseUrl, requirePosCredentials } from "../../../harness/config/settings.js";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { ensureAuthenticated, getSessionPath } from "../../../harness/helpers/auth.js";
import { expect, test } from "../harness/pos-fixtures.js";
import { completePayment } from "../harness/pos-payment.js";
import { selectClientByCedula } from "../harness/pos-sale-flow.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "public-document-share.json"), "utf-8")
);



for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Public Document Share @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(scenario.authType) });

    test.use({
      permissions: ['clipboard-read', 'clipboard-write'],
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

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
        await searchAndSelectProduct(page, { name: scenario.shareData.productName });
      });

      await test.step("Search and select client", async () => {
        await selectClientByCedula(page, scenario.shareData.clientCedula, { snackbarRequired: true });
      });

      await test.step("Proceed to payment and finish sale", async () => {
        await page.getByRole('button', { name: /Terminar Venta/i }).click();
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);

        await completePayment(page, { 
          paymentMethod: scenario.shareData.paymentMethod, 
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
        
        const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
        const clipboardText = await handle.jsonValue();
        
        expect(clipboardText).toContain(publicToken);
        
        shareUrl = clipboardText;
      });

      await test.step("Validate Public View Access Control (Invalid Token)", async () => {
        const context = page.context();
        const mobilePage = await context.newPage();
        
        const invalidToken = 'INVALID_TOKEN_12345';
        const invalidUrl = shareUrl.replace(publicToken, invalidToken);

        const publicApiPromise = mobilePage.waitForResponse(res => 
          (res.url().includes(`/api/v1/public/documents/${invalidToken}`) || res.url().includes(`/api/v1/get-document/${invalidToken}`)) && 
          res.status() === 404
        );

        await mobilePage.goto(invalidUrl);
        await publicApiPromise;

        const errorIcon = mobilePage.locator('.mdi-alert-circle').first();
        await expect(errorIcon).toBeVisible({ timeout: 10000 });

        await mobilePage.close();
      });
    });
  });
}
