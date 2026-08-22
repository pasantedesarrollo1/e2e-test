import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../harness/auth.js";
import { SEED } from "../harness/seed.js";
import { navigateToProductAndVerifyRecipeDecimals } from "./herness/recipe-helpers.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Recipe Decimals Validation @release", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("Validates elaborated product shows 2 decimals in UI and exact amount in tooltip", async ({ page }) => {
    test.setTimeout(120_000);
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/products/list", authType: "retail" });

    await navigateToProductAndVerifyRecipeDecimals(page, {
      tenantBaseUrl,
      productName: SEED.recipeDecimals.elaborado.productName,
      ingredientName: SEED.recipeDecimals.elaborado.ingredientName,
      exactAmount: SEED.recipeDecimals.elaborado.exactAmount,
      roundedAmount: SEED.recipeDecimals.elaborado.roundedAmount,
    });
  });

  test("Validates pre-elaborated product shows 2 decimals in UI and exact amount in tooltip", async ({ page }) => {
    test.setTimeout(120_000);
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/products/list", authType: "retail" });

    await navigateToProductAndVerifyRecipeDecimals(page, {
      tenantBaseUrl,
      productName: SEED.recipeDecimals.preElaborado.productName,
      ingredientName: SEED.recipeDecimals.preElaborado.ingredientName,
      exactAmount: SEED.recipeDecimals.preElaborado.exactAmount,
      roundedAmount: SEED.recipeDecimals.preElaborado.roundedAmount,
    });
  });
});