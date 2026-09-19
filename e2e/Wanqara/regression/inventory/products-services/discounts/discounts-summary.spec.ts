/* eslint-disable */
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertDiscountSummary, fillDiscountForm , type DiscountPayload } from "./harness/discount-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

type ScenarioData = AdminScenario & {
  loginMode?: 'fresh' | 'cached';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  authType?: string;
  discountData: DiscountPayload;
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "discounts-summary.json"), "utf-8"))
);

test.describe("Inventory - Discounts (Summary Rendering)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario) => {

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
