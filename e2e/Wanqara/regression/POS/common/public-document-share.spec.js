import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { ensureCashRegisterOpen } from "../harness/cash-register/cash-register-helpers.js";
import { selectClientByCedula } from '../../../harness/helpers/people/client-helpers.js';
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { expect, test } from "../harness/setup/pos-fixtures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "public-document-share.json"), "utf-8")
);

for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Public Document Share @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(scenario.authType),
        subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode,
      openingAmount: scenario.openingAmount });

    test.use({ permissions: ['clipboard-read', 'clipboard-write'], openingAmount: scenario.openingAmount });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("validates tokenization via share-token API, clipboard flow, public view and error state", async ({ page, browser }) => {
      test.setTimeout(180_000);

      let publicToken = null;
      let shareUrl = null;

      await test.step("Navigate to POS and setup", async () => {
        const targetPath = scenario.authType === 'restaurant' ? '/pos/restaurant-home' : '/pos/home';
        await ensureAuthenticated(page, { targetPath, authType: scenario.authType });
        await ensureCashRegisterOpen(page, scenario.openingAmount, scenario.subsidiaryName, scenario.subsidiaryCode, scenario.authType);
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

      await test.step("Validate Public View Rendering (Real Token)", async () => {
        // Usar un contexto limpio (sin storageState) para probar la vista pública
        const publicContext = await browser.newContext();
        const publicPage = await publicContext.newPage();

        await publicPage.goto(shareUrl);

        // Validamos explícitamente que la UI carga (tal cual muestran las capturas: "Visor de PDF")
        // Sin depender de llamadas backend ya que el token resuelve en el front
        const viewerTitle = publicPage.getByText('Visor de PDF', { exact: false }).first();
        await expect(viewerTitle).toBeVisible({ timeout: 15000 });
        
        // También podemos validar que NO haya ícono de error
        await expect(publicPage.locator('.mdi-alert-circle').first()).not.toBeVisible();

        await publicContext.close();
      });
    });
  });
}
