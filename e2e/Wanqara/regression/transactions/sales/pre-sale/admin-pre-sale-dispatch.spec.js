import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";

import { AdminSaleWorkflow, PreSaleStrategy } from "../../../../harness/helpers/workflows/admin-sale-workflow.js";

import scenarios from "./0-json-data/admin-pre-sale-dispatch.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Admin Pre-Sales - Mixed Cart / Dispatch Logic", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes an admin pre-sale with mixed cart (focus)" : "Completes an admin pre-sale with mixed cart",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Create Admin Pre-Sale with Mixed Cart", async () => {
          await new AdminSaleWorkflow(page, new PreSaleStrategy())
            .withAuth(scenario.authType)
            .withDocumentType(scenario.saleParams.documentType)
            .withClient(scenario.saleParams.clientCedula)
            .withMixedCart(scenario.saleParams.mixedCart, { isPreSale: true })
            .withPaymentMethod(scenario.saleParams.paymentMethod)
            .execute();
        });
      }
    );
  });
});
