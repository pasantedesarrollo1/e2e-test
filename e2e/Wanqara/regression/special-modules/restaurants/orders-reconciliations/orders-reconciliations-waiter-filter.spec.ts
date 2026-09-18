/* eslint-disable */
import type { WaiterFilterData } from "@/e2e/Wanqara/regression/special-modules/restaurants/harness/restaurant-helpers.ts";
interface ScenarioData extends ScenarioDefinition, TestMetadata {
  authType: string;
  filterData: WaiterFilterData;
}
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { filterByWaiter } from "../harness/restaurant-helpers.js";

import scenarios from "./0-json-data/orders-reconciliations-waiter-filter.json" with { type: "json" };

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

test.describe("Orders Reconciliations - Waiter Filter", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "filters reconciliations by waiter using advanced search (focus)" : "filters reconciliations by waiter using advanced search",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Navigate to orders reconciliations list", async () => {
          await ensureAuthenticated(page, {
            targetPath: "/admin/orders-reconciliations/list",
            authType: scenario.authType});
        });

        await test.step("Filter by waiter and validate results", async () => {
          await filterByWaiter(page, scenario.filterData);
        });
      }
    );
  });
});