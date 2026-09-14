import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { buildPreSaleMixedCart } from "../harness/admin-cart-helpers.js";
import { runAdminPreSaleFlow } from "../harness/admin-pre-sale-flow.js";

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
          await runAdminPreSaleFlow(page, {
            authType: scenario.authType,
            documentType: scenario.saleParams.documentType,
              clientCedula: scenario.saleParams.clientCedula,
              paymentMethod: scenario.saleParams.paymentMethod,
            // Intentionally null so `runAdminPreSaleFlow` doesn't auto-add a default product
            productName: null, 
            beforeFinish: async (p) => await buildPreSaleMixedCart(p, scenario.saleParams.mixedCart)});
        });
      }
    );
  });
});
