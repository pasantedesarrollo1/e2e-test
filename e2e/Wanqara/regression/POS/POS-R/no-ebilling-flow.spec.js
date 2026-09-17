import { expect, test } from "../../../harness/fixtures/stage.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from "../harness/sales/pos-checkout-helpers.js";
import { completePayment } from "../harness/payments/pos-payment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "no-ebilling-flow.json"), "utf-8")
);

import { ensureAuthenticated, logoutFromSession, withSessionRetry } from "../../../harness/helpers/auth/auth.js";
import { ensureSubsidiaryConfig, navigateToSubsidiaryDetail } from "../../../harness/helpers/env/env-setup-flow.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode,
      ebillingEnabled: scenario.ebillingEnabled,
      businessType: scenario.businessType
    });

    test("Direct Sale with Electronic Billing Disabled", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(120_000);

      await test.step("1. Validar que la Facturación Electrónica no esté disponible", async () => {
        const documentTypeSelect = page.locator('.v-select').filter({ hasText: /(Factura electrónica|Recibos)/i }).first();
        await expect(documentTypeSelect).toBeVisible();
        
        await documentTypeSelect.click();
        
        const listbox = page.locator('.v-overlay-container .v-overlay--active .v-list');
        
        await expect(listbox.getByText('Recibos', { exact: true })).toBeVisible();
        
        await expect(listbox.getByText('Factura electrónica', { exact: true })).not.toBeVisible();
        
        await page.keyboard.press("Escape");
      });

      await test.step("2. Agregar un producto a la venta", async () => {
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: null });
      });

      await test.step("3. Proceder al pago", async () => {
        await clickFinishSale(page);
      });

      await test.step("4. Finalizar el pago", async () => {
        await completePayment(page, { paymentMethod: scenario.paymentMethod });
      });

      await test.step("5. Activar Facturación Electrónica y cerrar sesión", async () => {
        await withSessionRetry(page, scenario.authType, async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/home", authType: scenario.authType });
          await navigateToSubsidiaryDetail(page, scenario.subsidiaryName, scenario.subsidiaryCode);
          await ensureSubsidiaryConfig(page, scenario.businessType, scenario.dispatchEnabled, true);
          
          await logoutFromSession(page);
        });
      });
    });
  });
}
