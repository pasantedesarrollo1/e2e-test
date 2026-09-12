import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { runAdminSaleFlow } from "./harness/admin-sale-flow.js";

import scenarios from "./0-json-data/admin-sale-documents.json" assert { type: "json" };

test.describe("Admin Sales - Documents", () => {
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
        scenario.only ? "Completes an admin sale with document type (focus)" : "Completes an admin sale with document type",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Create Admin Sale", async () => {
            await runAdminSaleFlow(page, {
              tenantBaseUrl,
              authType: scenario.authType,
              documentType: scenario.saleParams.documentType,
              productName: scenario.saleParams.productName,
            });
          });
        }
      );
    });
  }
});