import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { withPath } from "../../../../harness/urls.js";
import { SEED } from "../../../../harness/seed.js";
import { createExtraCategory, assignProductsToExtraCategory, verifyDeletionConstraintsAndRemoveProducts, deleteExtraCategory } from "./harness/extras-crud-helpers.js";
import { testByProductFlow } from "./harness/extras-by-product-helpers.js";

const TICKET = {
  ws: null,
  tes: 'TES-214',
  release: 'v7.10.0',
  summary: 'Implementar test de creacion de categoria extra',
  addedToRegression: 'true',
};

test.describe.serial("Extras Manager — Extra Categories @release", () => {
  requirePosCredentials(test);

  let categoryName;
  let product1;
  let product2;
  let searchTerm;

  test.beforeAll(() => {
    categoryName = SEED.extrasManager.category.name;
    product1 = SEED.extrasManager.products.items.sinStock.name;
    product2 = SEED.extrasManager.products.items.conStock.name;
    searchTerm = SEED.extrasManager.products.searchTerm;
  });

  test.beforeEach(async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    await page.goto(withPath(tenantBaseUrl, "/admin/categories/extras/list"));
    await page.waitForLoadState("networkidle");
  });

  test("ensures a clean state by removing existing category if present", async ({ page }) => {
    const categorySearchInput = page.getByPlaceholder(/Buscar categoría/i);
    await expect(categorySearchInput).toBeVisible();
    await categorySearchInput.fill(categoryName);
    await page.waitForTimeout(1000); // Wait for search debounce

    const categoryItem = page.getByText(categoryName, { exact: true }).first();
    if (await categoryItem.isVisible()) {
      await categoryItem.click();
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
      }
      await deleteExtraCategory(page);
    }
  });

  test("creates a new extra category and assigns products", async ({ page }) => {
    await createExtraCategory(page, categoryName);
    await assignProductsToExtraCategory(page, categoryName, searchTerm, [product1, product2]);
  });

  test("validates deletion constraints when category has associated products", async ({ page }) => {
    const categorySearchInput = page.getByPlaceholder(/Buscar categoría/i);
    await categorySearchInput.fill(categoryName);
    await page.waitForTimeout(1000);
    const categoryItem = page.getByText(categoryName, { exact: true }).first();
    await categoryItem.click();
    await page.waitForTimeout(1000);

    await verifyDeletionConstraintsAndRemoveProducts(page);
  });

  test("deletes the category and recreates it for subsequent flows", async ({ page }) => {
    const categorySearchInput = page.getByPlaceholder(/Buscar categoría/i);
    await categorySearchInput.fill(categoryName);
    await page.waitForTimeout(1000);
    const categoryItem = page.getByText(categoryName, { exact: true }).first();
    await categoryItem.click();
    await page.waitForTimeout(1000);

    await deleteExtraCategory(page);
    await createExtraCategory(page, categoryName);
    await assignProductsToExtraCategory(page, categoryName, searchTerm, [product1, product2]);
  });

  test("validates 'Por producto' relation flow and cleanup", async ({ page }) => {
    await testByProductFlow(page, categoryName, searchTerm);
  });
});
