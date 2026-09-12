import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { runAdminSaleFlow } from "./harness/admin-sale-flow.js";
import { buildMixedCart } from "./harness/admin-cart-helpers.js";

import scenarios from "./0-json-data/admin-sale-dispatch.json" assert { type: "json" };

test.describe("Admin Sales - Mixed Cart / Dispatch Logic", () => {
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
        scenario.only ? "Completes an admin sale with mixed cart (focus)" : "Completes an admin sale with mixed cart",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Create Admin Sale with Mixed Cart", async () => {
            await runAdminSaleFlow(page, {
              tenantBaseUrl,
              authType: scenario.authType,
              documentType: scenario.saleParams.documentType,
              // Intentionally null so `runAdminSaleFlow` doesn't auto-add a default product
              productName: null, 
              beforeFinish: async (p) => await buildMixedCart(p, scenario.saleParams.dispatchEnabled),
            });
          });
        }
      );
    });
  }
});