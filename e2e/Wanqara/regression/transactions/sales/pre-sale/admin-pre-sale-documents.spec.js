import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { AdminSaleWorkflow, PreSaleStrategy } from "../../../../harness/helpers/workflows/admin-sale-workflow.js";

import scenarios from "./0-json-data/admin-pre-sale-documents.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Admin Pre-Sales - Different Document Types", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
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
