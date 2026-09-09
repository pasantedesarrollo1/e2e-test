import { expect } from "@playwright/test";
import { expectSnackbar } from "../../../../../harness/ui-helpers.js";
import { SEED } from "../../../../../harness/seed.js";

/**
 * Tests the "Por producto" flow: relates products to a category and cleans them up.
 * @param {import('@playwright/test').Page} page 
 * @param {string} categoryName 
 * @param {string} productSearchTerm
 */
export async function testByProductFlow(page, categoryName, productSearchTerm) {
  const byProductTab = page.getByRole('button', { name: /Por producto/i });
  await expect(byProductTab).toBeVisible();
  await byProductTab.click();

  const cleanupRelations = async () => {
    const sidebarSearchInput = page.getByRole('textbox', { name: /Buscar producto relacionado/i });
    await expect(sidebarSearchInput).toBeVisible();
    await sidebarSearchInput.clear();
    await sidebarSearchInput.fill(productSearchTerm);
    await page.waitForTimeout(500); // frontend debounce

    const sidebarListItems = page.locator('aside').getByRole('listitem');
    const sidebarCount = await sidebarListItems.count();

    for (let i = 0; i < sidebarCount; i++) {
      await sidebarListItems.nth(i).click();
      await page.waitForTimeout(500); // wait for detail panel to load

      const deleteRelationBtn = page.getByRole('button', { name: /Eliminar relación/i }).first();
      while (await deleteRelationBtn.isVisible()) {
        await deleteRelationBtn.click();

        const confirmDeleteBtn = page.getByRole('dialog').getByRole('button', { name: /Eliminar relación/i }).last();
        await expect(confirmDeleteBtn).toBeVisible();

        const deleteResponsePromise = page.waitForResponse(
          (res) => res.url().includes("/related-extras") && res.request().method() === "DELETE" && [200, 201].includes(res.status())
        );
        await confirmDeleteBtn.click();
        await deleteResponsePromise;

        await expectSnackbar(page, new RegExp(SEED.extrasManager.messages.relationDeleted, "i"));
        await page.waitForTimeout(500); // let UI update before checking again
      }
      
      const emptyMsg = page.getByText(new RegExp(SEED.extrasManager.messages.noCategories, "i"));
      await expect(emptyMsg).toBeVisible();
    }
  };

  const relateProducts = async () => {
    const relateProductsBtn = page.getByRole('button', { name: /Relacionar productos/i });
    await expect(relateProductsBtn).toBeVisible();
    await relateProductsBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const categorySearchInput = dialog.getByRole('textbox', { name: /Buscar categoría extra/i });
    await expect(categorySearchInput).toBeVisible();
    
    const categorySearchResponse = page.waitForResponse(
      (res) => res.url().includes("/inventory/categories") && res.request().method() === "GET" && res.status() === 200
    );
    await categorySearchInput.fill(categoryName);
    await categorySearchResponse;

    const categoryOption = dialog.getByText(categoryName, { exact: true }).first();
    await expect(categoryOption).toBeVisible();
    await categoryOption.click();

    const productSearchInput = dialog.getByRole('textbox', { name: /Buscar producto/i, exact: true });
    await expect(productSearchInput).toBeVisible();
    
    const loadingIndicator = dialog.getByText(new RegExp(SEED.extrasManager.messages.loadingProducts, "i"));
    await expect(loadingIndicator).toBeHidden({ timeout: 15000 }).catch(() => {});

    const productSearchResponse = page.waitForResponse(
      (res) => res.url().includes("/inventory/products-list") && res.request().method() === "GET" && res.status() === 200
    );
    await productSearchInput.fill(productSearchTerm);
    await productSearchResponse;

    const productItems = dialog.getByRole('listitem').filter({ hasText: /\$/ }); 
    const productCount = await productItems.count();
    
    for (let i = 0; i < productCount; i++) {
      await productItems.nth(i).click();
    }

    const submitBtn = page.getByTestId('association-submit').or(dialog.getByRole('button', { name: /Relacionar|Agregar/i }).last());
    await expect(submitBtn).toBeVisible();

    const postResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/related-extras") && res.request().method() === "POST" && [200, 201].includes(res.status())
    );
    await submitBtn.click();
    await postResponsePromise;

    await expectSnackbar(page, /productos relacionados/i);
  };

  await cleanupRelations();
  await relateProducts();
  await cleanupRelations();
  await relateProducts();
}
