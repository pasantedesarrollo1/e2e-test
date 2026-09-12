import { test } from "@playwright/test";
import { annotateTicket } from "../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { runAdminPreSaleFlow } from "../harness/admin-pre-sale-flow.js";
import { cancelFirstSaleAndVerify } from "../harness/cancel-sale-helpers.js";

import scenarios from "./0-json-data/admin-pre-sale-cancellation.json" assert { type: "json" };

test.describe.serial("Cancel Pre-Sales (Admin)", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);

      test(
        scenario.only ? "Creates a pre-sale and cancels it (focus)" : "Creates a pre-sale and cancels it",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ browser }) => {
          test.setTimeout(180_000);
          
          // Using fresh contexts across serial runs to guarantee state isolation
          const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
          const page = await context.newPage();
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Create Pre-Sale", async () => {
            await runAdminPreSaleFlow(page, {
              tenantBaseUrl,
              authType: scenario.authType,
              documentType: scenario.saleParams.documentType,
              productName: scenario.saleParams.productName,
            });
          });

          await test.step("Cancel Pre-Sale and Verify Modal", async () => {
            await cancelFirstSaleAndVerify(page, {
              tenantBaseUrl,
              expectSwitch: scenario.cancelParams.expectSwitch,
              expectMessage: scenario.cancelParams.expectMessage,
            });
          });

          await page.close();
          await context.close();
        }
      );
    });
  }
});
