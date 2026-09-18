/* eslint-disable */
import { test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { getSessionPath } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { AdminSaleWorkflow, PreSaleStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/admin-sale-workflow.js";
import { cancelFirstSaleAndVerify } from "@/e2e/Wanqara/regression/transactions/sales/harness/cancel-sale-helpers.js";

import scenariosRaw from "./0-json-data/admin-pre-sale-cancellation.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface SaleParams {
  documentType: string;
  clientCedula: string;
  productName: string;
  paymentMethod: string;
}

interface CancelParams {
  expectSwitch?: boolean;
  expectMessage?: boolean;
}

interface ScenarioData extends FlatScenario {
  authType: string;
  saleParams: SaleParams;
  cancelParams: CancelParams;
}


test.describe.serial("Cancel Pre-Sales (Admin)", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Creates a pre-sale and cancels it (focus)" : "Creates a pre-sale and cancels it",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ browser }) => {
        test.setTimeout(180_000);
        
        const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
        const page = await context.newPage();

        await test.step("Create Pre-Sale", async () => {
          await new AdminSaleWorkflow(page, new PreSaleStrategy())
            .withAuth(scenario.authType)
            .withDocumentType(scenario.saleParams.documentType)
            .withClient(scenario.saleParams.clientCedula)
            .addPreSaleItem(scenario.saleParams.productName)
            .withPaymentMethod(scenario.saleParams.paymentMethod)
            .execute();
        });

        await test.step("Cancel Pre-Sale and Verify Modal", async () => {
          await cancelFirstSaleAndVerify(page, {
            expectSwitch: scenario.cancelParams.expectSwitch || false,
            expectMessage: scenario.cancelParams.expectMessage || false});
        });

        await page.close();
        await context.close();
      }
    );
  });
});
