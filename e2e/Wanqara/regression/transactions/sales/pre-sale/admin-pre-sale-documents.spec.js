import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { runAdminPreSaleFlow } from "../harness/admin-pre-sale-flow.js";

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
          await runAdminPreSaleFlow(page, {
            authType: scenario.authType,
            documentType: scenario.saleParams.documentType,
              clientCedula: scenario.saleParams.clientCedula,
              paymentMethod: scenario.saleParams.paymentMethod,
            productName: scenario.saleParams.productName});
        });
      }
    );
  });
});
