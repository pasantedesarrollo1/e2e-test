import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/restaurant.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { clickFinishSale } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScenarioData {
  description: string;
  openingAmount: string;
  authType: string;
  loginMode: 'fresh' | 'cached' | '';
  subsidiaryName: string;
  subsidiaryCode: string;
  ebillingEnabled?: boolean;
  productName: string;
  paymentMethod: string;
  forceBusinessType: string;
  dispatchEnabled?: boolean;
  metadata?: { testScope?: string; ws?: string; [key: string]: unknown };
}

const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "no-ebilling-flow.json"), "utf-8"))
);

import { ensureAuthenticated, logoutFromSession, withSessionRetry } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { ensureSubsidiaryConfig, navigateToSubsidiaryDetail } from "@/e2e/Wanqara/harness/helpers/env/env-setup-flow.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode,
      ebillingEnabled: scenario.ebillingEnabled,
      
    });

    test("Direct Sale with Electronic Billing Disabled", async ({ restaurantEnvironment }) => {
      const { page } = restaurantEnvironment;
      test.setTimeout(120_000);

      await test.step("1. Validar que la Facturación Electrónica no esté disponible", async () => {
        const documentTypeSelect = page.locator('.v-select').filter({ hasText: /(Factura electrónica|Recibos)/i }).first();
        await expect(documentTypeSelect).toBeVisible();
        
        await documentTypeSelect.click();
        
        const listbox = page.locator('.v-overlay-container .v-overlay--active .v-list');
        
        await expect(listbox.getByText('Recibos', { exact: true })).toBeVisible();
        
        await expect(listbox.getByText('Factura electrónica', { exact: true })).toBeHidden();
        
        await page.keyboard.press("Escape");
      });

      await test.step("2. Agregar un producto a la venta", async () => {
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: undefined });
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
          await ensureSubsidiaryConfig(page, scenario.forceBusinessType, scenario.dispatchEnabled, true);
          
          await logoutFromSession(page);
        });
      });
    });
  });
}
