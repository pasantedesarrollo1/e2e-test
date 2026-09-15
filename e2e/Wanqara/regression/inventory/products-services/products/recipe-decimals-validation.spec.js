import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { navigateToProductAndVerifyRecipeDecimals } from "./harness/recipe-helpers.js";

import scenarios from "./0-json-data/recipe-decimals.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Products (Recipe Decimals Validation)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test(`Validates product '${scenario.recipeData.productName}' shows 2 decimals in UI and exact amount in tooltip`, async ({ page }) => {
        test.setTimeout(120_000);
        await test.step('Garantizar autenticación y navegar', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/products/list", authType: scenario.authType });
        });

        await test.step('Verificar comportamiento de decimales en la receta', async () => {
          await navigateToProductAndVerifyRecipeDecimals(page, {
            productName: scenario.recipeData.productName,
            ingredientName: scenario.recipeData.ingredientName,
            exactAmount: scenario.recipeData.exactAmount,
            roundedAmount: scenario.recipeData.roundedAmount});
        });
      });
    });
  
});
