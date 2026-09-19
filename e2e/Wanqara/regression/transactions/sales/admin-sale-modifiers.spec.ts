/* eslint-disable */
import { test } from "@playwright/test";
import { selectCheckout, selectPaymentMethod, searchAndSelectProduct, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/shared/client-picker.js";


// @ts-ignore
import { applyGeneralDiscount, applyManualSurcharge } from "@/e2e/Wanqara/regression/transactions/harness/admin-modifier-helpers.js";

import scenariosRaw from "./0-json-data/admin-sale-modifiers.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(scenariosRaw);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

interface SaleParams {
  warehouseName?: string;
  documentType: string;
  clientCedula: string;
  identityType?: string;
  productName: string;
  paymentMethod: string;
  modifierType: string;
  modifierRate: string;
}

type ScenarioData = AdminScenario & {
  authType: string;
  saleParams: SaleParams;
}


const MODIFIERS_MAP = {
  "discount": applyGeneralDiscount,
  "surcharge": applyManualSurcharge
};

test.describe("Admin Sales - Sale Modifiers", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes a sale applying a modifier (focus)" : "Completes a sale applying a modifier",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);
        
        const modifierFn = MODIFIERS_MAP[scenario.saleParams.modifierType as keyof typeof MODIFIERS_MAP];
        if (!modifierFn) {
          throw new Error(`Invalid modifierType: ${scenario.saleParams.modifierType}`);
        }

        await test.step(`Create Admin Sale with modifier: ${scenario.saleParams.modifierType}`, async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
            await selectDocumentType(page, scenario.saleParams.documentType);
            await selectClientByCedula(page, scenario.saleParams.clientCedula, {  identityType: scenario.saleParams.identityType });
            await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
            await modifierFn(page, scenario.saleParams.modifierRate);
            await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
            await submitAdminSale(page);
        });
      }
    );
  });
});
