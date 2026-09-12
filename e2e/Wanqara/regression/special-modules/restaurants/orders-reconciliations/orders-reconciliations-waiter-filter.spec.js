import { test } from "@playwright/test";
import { annotateTicket } from "../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth.js";
import { filterByWaiter } from "../harness/restaurant-helpers.js";

import scenarios from "./0-json-data/orders-reconciliations-waiter-filter.json" assert { type: "json" };

test.describe("Orders Reconciliations - Waiter Filter", () => {
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
        scenario.only ? "filters reconciliations by waiter using advanced search (focus)" : "filters reconciliations by waiter using advanced search",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Navigate to orders reconciliations list", async () => {
            await ensureAuthenticated(page, {
              tenantBaseUrl,
              targetPath: "/admin/orders-reconciliations/list",
              authType: scenario.authType,
            });
          });

          await test.step("Filter by waiter and validate results", async () => {
            await filterByWaiter(page, scenario.filterData);
          });
        }
      );
    });
  }
});