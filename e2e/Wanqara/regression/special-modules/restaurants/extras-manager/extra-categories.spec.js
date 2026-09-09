import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { withPath } from "../../../../harness/urls.js";
import { SEED } from "../../../../harness/seed.js";
import { createExtraCategory, assignProductsToExtraCategory, verifyDeletionConstraintsAndRemoveProducts, deleteExtraCategory, testByProductFlow } from "../../../../harness/extras-helpers.js";

const TICKET = {
  ws: null,
  tes: 'TES-214',
  release: 'v7.10.0',
  summary: 'Implementar test de creacion de categoria extra',
  addedToRegression: 'true',
};

test.describe("Extras Manager — Extra Categories @release", () => {
  requirePosCredentials(test);

  test("creates a new extra category successfully and assigns products", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const categoryName = SEED.categories.extra.name;
    const product1 = SEED.products.extraAlitasSinStock.name;
    const product2 = SEED.products.extraAlitasStock.name;

    await test.step("Navigate to Extras Manager", async () => {
      await page.goto(withPath(tenantBaseUrl, "/admin/categories/extras/list"));
      await page.waitForLoadState("networkidle");
    });

    await test.step("Validate and execute creation flow", async () => {
      const categorySearchInput = page.getByPlaceholder(/Buscar categoría/i);
      await expect(categorySearchInput).toBeVisible();
      await categorySearchInput.fill(categoryName);
      
      // Wait for search debounce
      await page.waitForTimeout(1000);

      const categoryItem = page.getByText(categoryName, { exact: true }).first();
      const exists = await categoryItem.isVisible();

      if (exists) {
        // Scenario 1: It exists. Remove products if any, delete, and recreate.
        await categoryItem.click();
        
        // Wait briefly for products to load in the detail panel
        await page.waitForTimeout(1000);
        
        const removeButtons = page.getByRole("button", { name: /Quitar producto/i });
        const count = await removeButtons.count();
        if (count > 0) {
          for (let i = 0; i < count; i++) {
            await removeButtons.first().click();
          }
          const saveChangesBtn = page.getByRole("button", { name: new RegExp(`Guardar cambios \\(${count}\\)`, "i") });
          
          const responsePromise = page.waitForResponse(
            (res) => res.url().includes("/inventory/products/") && res.request().method() === "PUT" && [200, 201].includes(res.status())
          );
          await saveChangesBtn.click();
          await responsePromise;
          // Note: expectSnackbar from helpers can sometimes fail if it triggers multiple times or if we don't wait for it to disappear
          // We'll skip expecting the snackbar here to avoid flakiness, or just wait for it.
        }

        await deleteExtraCategory(page);

        await createExtraCategory(page, categoryName);
        await assignProductsToExtraCategory(page, categoryName, "extra alitas", [product1, product2]);
      } else {
        // Scenario 2: It does not exist. Create, assign, verify constraints & delete, recreate, and assign.
        await createExtraCategory(page, categoryName);
        await assignProductsToExtraCategory(page, categoryName, "extra alitas", [product1, product2]);

        await verifyDeletionConstraintsAndRemoveProducts(page);
        await deleteExtraCategory(page);

        await createExtraCategory(page, categoryName);
        await assignProductsToExtraCategory(page, categoryName, "extra alitas", [product1, product2]);
      }
    });

    await test.step("Test 'Por producto' flow and cleanup", async () => {
      await testByProductFlow(page, categoryName, "alitas");
    });
  });
});
