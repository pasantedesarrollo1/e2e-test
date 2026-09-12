import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth.js";
import { navigateToProductAndVerifyRecipeDecimals } from "./harness/recipe-helpers.js";

import scenarios from "./0-json-data/recipe-decimals.json" assert { type: "json" };

test.describe("Inventory - Products (Recipe Decimals Validation)", () => {
  requirePosCredentials(test);
  const tenantBaseUrl = getTenantBaseUrl();

  for (const scenario of scenarios) {
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuración en JSON';
        test(`Omitido: ${razon}`, async () => {});
      });
      continue;
    }

    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const executionTag = `@${scope}`;
    const describeBlock = scenario.only ? test.describe.only : test.describe;

    describeBlock(`Escenario: ${scenario.description} ${executionTag}`, () => {
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(`Validates product '${scenario.recipeData.productName}' shows 2 decimals in UI and exact amount in tooltip`, async ({ page }) => {
        test.setTimeout(120_000);
        await test.step('Garantizar autenticación y navegar', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/products/list", authType: scenario.authType });
        });

        await test.step('Verificar comportamiento de decimales en la receta', async () => {
          await navigateToProductAndVerifyRecipeDecimals(page, {
            tenantBaseUrl,
            productName: scenario.recipeData.productName,
            ingredientName: scenario.recipeData.ingredientName,
            exactAmount: scenario.recipeData.exactAmount,
            roundedAmount: scenario.recipeData.roundedAmount,
          });
        });
      });
    });
  }
});
