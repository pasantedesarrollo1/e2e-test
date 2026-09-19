/* eslint-disable */
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { navigateToProductAndVerifyRecipeDecimals , type VerifyRecipeDecimalsOptions } from "./harness/recipe-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

type ScenarioData = AdminScenario & {
  loginMode?: 'fresh' | 'cached';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  authType?: string;
  recipeData: VerifyRecipeDecimalsOptions;
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "recipe-decimals.json"), "utf-8"))
);

test.describe("Inventory - Products (Recipe Decimals Validation)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario) => {

    test.use({ 
      targetPath: "/admin/products/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test(`Validates product '${scenario.recipeData.productName}' shows 2 decimals in UI and exact amount in tooltip`, async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(120_000);
      
      await test.step('Verificar comportamiento de decimales en la receta', async () => {
        await navigateToProductAndVerifyRecipeDecimals(page, {
          productName: scenario.recipeData.productName,
          ingredientName: scenario.recipeData.ingredientName,
          exactAmount: scenario.recipeData.exactAmount,
          roundedAmount: scenario.recipeData.roundedAmount
        });
      });
    });

  });
  
});
