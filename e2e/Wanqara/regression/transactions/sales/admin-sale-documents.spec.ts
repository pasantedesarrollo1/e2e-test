/* eslint-disable */
import { test } from "@playwright/test";
import { selectCheckout, selectPaymentMethod, searchAndSelectProduct, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";



import scenariosRaw from "./0-json-data/admin-sale-documents.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface SaleParams {
  warehouseName?: string;
  documentType: string;
  clientCedula: string;
  productName: string;
  paymentMethod: string;
}

interface ScenarioData extends FlatScenario {
  authType: string;
  saleParams: SaleParams;
}


test.describe("Admin Sales - Documents", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes an admin sale with document type (focus)" : "Completes an admin sale with document type",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Create Admin Sale", async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
            await selectDocumentType(page, scenario.saleParams.documentType);
            await selectClientByCedula(page, scenario.saleParams.clientCedula);
            await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
            await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
            await submitAdminSale(page);
        });
      }
    );
  });
});
