import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { assertDiscountSummary, fillDiscountForm } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/discounts-summary.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Discounts (Summary Rendering)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test(`verifies discount summary for ${scenario.discountData.applicationMethod} + ${scenario.discountData.type}`, async ({ page }) => {
        await test.step("Navigate to the add discount form", async () => {
          await fillDiscountForm(page, {
            ...scenario.discountData
          });
        });

        await test.step("Verify the summary panel reflects the selected options", async () => {
          await assertDiscountSummary(page, scenario.discountData);
        });
      });
    });
  
});
