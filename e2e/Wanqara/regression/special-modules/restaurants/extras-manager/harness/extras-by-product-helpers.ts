import { expect, type Page } from "@playwright/test";
import { expectSnackbar } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

const relationDeletedMsg = "Relaci.n eliminada";
const noCategoriesMsg = "A.n no hay categor.as relacionadas";
const loadingProductsMsg = "Cargando";

export async function testByProductFlow(page: Page, categoryName: string, productSearchTerm: string): Promise<void> {
  const byProductTab = page.getByRole('button', { name: /Por producto/i });
  await expect(byProductTab).toBeVisible();
  await byProductTab.click();

  const cleanupRelations = async (): Promise<void> => {
    const sidebarSearchInput = page.getByRole('textbox', { name: /Buscar producto relacionado/i });
    await expect(sidebarSearchInput).toBeVisible();
    await sidebarSearchInput.clear();
    await sidebarSearchInput.fill(productSearchTerm);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1500); 

    const sidebarListItems = page.locator('aside').locator('.v-list-item');
    const sidebarCount = await sidebarListItems.count();

    for (let i = 0; i < sidebarCount; i++) {
      await sidebarListItems.nth(i).click();
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(500); 

      const deleteRelationBtn = page.getByRole('button', { name: /Eliminar relaci.n/i }).first();
      while (await deleteRelationBtn.isVisible()) {
        await deleteRelationBtn.click();

        const confirmDeleteBtn = page.getByRole('dialog').getByRole('button', { name: /Eliminar relaci.n/i }).last();
        await expect(confirmDeleteBtn).toBeVisible();

        const deleteResponsePromise = page.waitForResponse(
          (res) => res.url().includes("/related-extras") && res.request().method() === "DELETE" && [200, 201].includes(res.status())
        );
        await confirmDeleteBtn.click();
        await deleteResponsePromise;

        await expectSnackbar(page, new RegExp(relationDeletedMsg, "i"));
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await page.waitForTimeout(500); 
      }
      
      const emptyMsg = page.getByText(new RegExp(noCategoriesMsg, "i"));
      await expect(emptyMsg).toBeVisible();
    }
  };

  const relateProducts = async (): Promise<void> => {
    const relateProductsBtn = page.getByRole('button', { name: /Relacionar productos/i });
    await expect(relateProductsBtn).toBeVisible();
    await relateProductsBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const categorySearchInput = dialog.getByRole('textbox', { name: /Buscar categor.a extra/i });
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
    
    const loadingIndicator = dialog.getByText(new RegExp(loadingProductsMsg, "i"));
    await expect(loadingIndicator).toBeHidden({ timeout: 15000 }).catch(() => {});

    await productSearchInput.fill(productSearchTerm);
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1500); 

    const productItems = dialog.locator('.v-list-item').filter({ hasText: /\$/ });
    await expect(productItems.first()).toBeVisible({ timeout: 5000 });
    const productCount = await productItems.count();
    
    if (productCount === 0) {
      throw new Error("No products found to associate. Check the search term or locator.");
    }

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
