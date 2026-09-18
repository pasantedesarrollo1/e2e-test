/* eslint-disable */
import { test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { AdminSaleWorkflow, PreSaleStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/admin-sale-workflow.js";

import scenariosRaw from "./0-json-data/admin-pre-sale-documents.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface SaleParams {
  documentType: string;
  clientCedula: string;
  productName: string;
  paymentMethod: string;
}

interface ScenarioData extends ScenarioDefinition, TestMetadata {
  authType: string;
  saleParams: SaleParams;
}


test.describe("Admin Pre-Sales - Different Document Types", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes a pre-sale using specified document type (focus)" : "Completes a pre-sale using specified document type",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step(`Create Admin Pre-Sale with document: ${scenario.saleParams.documentType}`, async () => {
          await new AdminSaleWorkflow(page, new PreSaleStrategy())
            .withAuth(scenario.authType)
            .withDocumentType(scenario.saleParams.documentType)
            .withClient(scenario.saleParams.clientCedula)
            .addPreSaleItem(scenario.saleParams.productName)
            .withPaymentMethod(scenario.saleParams.paymentMethod)
            .execute();
        });
      }
    );
  });
});
