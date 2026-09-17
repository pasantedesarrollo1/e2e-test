import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { selectClientByCedula } from '../../../harness/helpers/people/client-helpers.js';
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { expect, test } from "../../../harness/fixtures/pos.fixture.js";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "public-document-share.json"), "utf-8")
);

test.describe("POS Public Document Share", () => {
  // Configurar permisos globales para esta suite
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  generateDataDrivenTests(test, scenarios, (scenario) => {
    test(scenario.description, async ({ posEnvironment, browser  }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);

      let publicToken = null;
      let shareUrl = null;

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
          paymentMethod: scenario.shareData.paymentMethod?.label || scenario.paymentMethod, 
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
});
