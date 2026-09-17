import { test } from "../../../../harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { navigateToProductAndVerifyRecipeDecimals } from "./harness/recipe-helpers.js";
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "recipe-decimals.json"), "utf-8")
);

test.describe("Inventory - Products (Recipe Decimals Validation)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {

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
