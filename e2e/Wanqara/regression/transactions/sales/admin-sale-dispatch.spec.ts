/* eslint-disable */
import { test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/shared/client-picker.js";
import { buildMixedCart } from "./harness/admin-cart-helpers.js";
import { selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";

import scenariosRaw from "./0-json-data/admin-sale-dispatch.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(scenariosRaw);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

interface MixedCartItem {
  name: string;
  productMode?: string;
}

interface SaleParams {
  warehouseName?: string;
  documentType: string;
  clientCedula: string;
  identityType?: string;
  paymentMethod: string;
  dispatchEnabled: boolean;
  mixedCart: MixedCartItem[];
}

type ScenarioData = AdminScenario & {
  authType: string;
  saleParams: SaleParams;
}


test.describe("Admin Sales - Mixed Cart / Dispatch Logic", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes an admin sale with mixed cart (focus)" : "Completes an admin sale with mixed cart",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Create Admin Sale with Mixed Cart", async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
            await selectDocumentType(page, scenario.saleParams.documentType);
            await selectClientByCedula(page, scenario.saleParams.clientCedula, {  identityType: scenario.saleParams.identityType });
            await buildMixedCart(page, scenario.saleParams.mixedCart as any, scenario.saleParams.dispatchEnabled);
            await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
            await submitAdminSale(page);
        });
      }
    );
  });
});
