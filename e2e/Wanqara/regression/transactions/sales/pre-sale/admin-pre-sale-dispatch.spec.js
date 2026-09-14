import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../../harness/helpers/reporting/annotate.js";
import { buildPreSaleMixedCart } from "../harness/admin-cart-helpers.js";
import { runAdminPreSaleFlow } from "../harness/admin-pre-sale-flow.js";

import scenarios from "./0-json-data/admin-pre-sale-dispatch.json" assert { type: "json" };

test.describe("Admin Pre-Sales - Mixed Cart / Dispatch Logic", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(
        scenario.only ? "Completes an admin pre-sale with mixed cart (focus)" : "Completes an admin pre-sale with mixed cart",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Create Admin Pre-Sale with Mixed Cart", async () => {
            await runAdminPreSaleFlow(page, {
              tenantBaseUrl,
              authType: scenario.authType,
              documentType: scenario.saleParams.documentType,
                clientCedula: scenario.saleParams.clientCedula,
                paymentMethod: scenario.saleParams.paymentMethod,
              // Intentionally null so `runAdminPreSaleFlow` doesn't auto-add a default product
              productName: null, 
              beforeFinish: async (p) => await buildPreSaleMixedCart(p, scenario.saleParams.mixedCart),
            });
          });
        }
      );
    });
  }
});
