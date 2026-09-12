import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { runAdminSaleFlow, applyGeneralDiscount, applyManualSurcharge } from "./harness/admin-sale-flow.js";

import scenarios from "./0-json-data/admin-sale-modifiers.json" assert { type: "json" };

const MODIFIERS_MAP = {
  "discount": applyGeneralDiscount,
  "surcharge": applyManualSurcharge
};

test.describe("Admin Sales - Sale Modifiers", () => {
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
        scenario.only ? "Completes a sale applying a modifier (focus)" : "Completes a sale applying a modifier",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();
          
          const modifierFn = MODIFIERS_MAP[scenario.saleParams.modifierType];
          if (!modifierFn) {
            throw new Error(`Invalid modifierType: ${scenario.saleParams.modifierType}`);
          }

          await test.step(`Create Admin Sale with modifier: ${scenario.saleParams.modifierType}`, async () => {
            await runAdminSaleFlow(page, {
              tenantBaseUrl,
              authType: scenario.authType,
              documentType: scenario.saleParams.documentType,
              productName: scenario.saleParams.productName,
              beforeFinish: async (p) => await modifierFn(p),
            });
          });
        }
      );
    });
  }
});