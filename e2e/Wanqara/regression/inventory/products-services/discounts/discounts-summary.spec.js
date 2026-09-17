import { test } from "../../../../harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { assertDiscountSummary, fillDiscountForm } from "./harness/discount-helpers.js";
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "discounts-summary.json"), "utf-8")
);

test.describe("Inventory - Discounts (Summary Rendering)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {

    test.use({ 
      targetPath: "/admin/discounts/add",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test(`verifies discount summary for ${scenario.discountData.applicationMethod} + ${scenario.discountData.type}`, async ({ adminApp }) => {
      const { page } = adminApp;
      
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
