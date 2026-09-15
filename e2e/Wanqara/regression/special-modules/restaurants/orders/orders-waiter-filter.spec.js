import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { filterByWaiter } from "../harness/restaurant-helpers.js";

import scenarios from "./0-json-data/orders-waiter-filter.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Orders - Waiter Filter", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Filters orders by waiter using advanced search (focus)" : "Filters orders by waiter using advanced search",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Navigate to orders list", async () => {
          await ensureAuthenticated(page, {
            targetPath: "/admin/orders/list",
            authType: scenario.authType});
        });

        await test.step("Filter by waiter and validate results", async () => {
          await filterByWaiter(page, scenario.filterData);
        });
      }
    );
  });
});