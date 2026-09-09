import { expect } from "@playwright/test";
import { expectSnackbar } from "./ui-helpers.js";

/**
 * Creates an extra category using the UI.
 * @param {import('@playwright/test').Page} page 
 * @param {string} categoryName 
 */
export async function createExtraCategory(page, categoryName) {
  const categoriesTab = page.getByRole('button', { name: /Categorías/i });
  if (await categoriesTab.isVisible()) {
    await categoriesTab.click();
  }

  const createCategoryBtn = page.getByRole('button', { name: /Nueva categoría extra/i });
  await expect(createCategoryBtn).toBeVisible();
  await createCategoryBtn.click();

  // Target the input inside the active dialog
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const nameInput = dialog.getByRole('textbox').first();
  await expect(nameInput).toBeVisible();
  await nameInput.fill(categoryName);

  const saveButton = dialog.getByRole("button", { name: /^Guardar$/i }).first();
  await expect(saveButton).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/inventory/categories") && 
             res.request().method() === "POST" && 
             [200, 201].includes(res.status())
  );

  await saveButton.click();
  await responsePromise;

  await expectSnackbar(page, "Categoría Creada");
}

/**
 * Assigns products to an extra category.
 * @param {import('@playwright/test').Page} page 
 * @param {string} categoryName 
 * @param {string} productSearchTerm
 * @param {string[]} productNamesToSelect
 */
export async function assignProductsToExtraCategory(page, categoryName, productSearchTerm, productNamesToSelect) {
  const categorySearchInput = page.getByPlaceholder(/Buscar categoría/i);
  await expect(categorySearchInput).toBeVisible();
  await categorySearchInput.fill(categoryName);

  // Wait for debounce and click the category
  const categoryItem = page.getByText(categoryName, { exact: true }).first();
  await expect(categoryItem).toBeVisible();
  await categoryItem.click();

  const addProductsBtn = page.getByRole("button", { name: /Agregar productos/i });
  await expect(addProductsBtn).toBeVisible();
  await addProductsBtn.click();

  const productSearchInput = page.getByPlaceholder(/Buscar producto/i).or(page.getByRole('textbox', { name: /Buscar producto/i }));
  await expect(productSearchInput).toBeVisible();
  await productSearchInput.fill(productSearchTerm);

  for (const productName of productNamesToSelect) {
    // Wait for the list item to appear and select it
    const productItem = page.getByRole("listitem").filter({ hasText: new RegExp(productName, "i") }).first();
    await expect(productItem).toBeVisible();
    await productItem.click();
  }

  const confirmAddBtn = page.getByRole("button", { name: new RegExp(`Agregar ${productNamesToSelect.length}`, "i") });
  await expect(confirmAddBtn).toBeVisible();
  await confirmAddBtn.click();

  const saveChangesBtn = page.getByRole("button", { name: new RegExp(`Guardar cambios \\(${productNamesToSelect.length}\\)`, "i") });
  await expect(saveChangesBtn).toBeVisible();
  
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/inventory/products/") &&
             res.request().method() === "PUT" &&
             [200, 201].includes(res.status())
  );
  
  await saveChangesBtn.click();
  // We can just wait for network idle if we don't know the exact endpoint for ExtraAssociationDialog
  // but wait, the prompt says "Cambios de productos extra guardados".
  
  await expectSnackbar(page, "Cambios de productos extra guardados");
}

/**
 * Validates that a category with products cannot be deleted,
 * then removes all its products and saves.
 * @param {import('@playwright/test').Page} page 
 */
export async function verifyDeletionConstraintsAndRemoveProducts(page) {
  const deleteCategoryBtn = page.getByRole("button", { name: "Eliminar categoría" });
  await expect(deleteCategoryBtn).toBeVisible();
  await deleteCategoryBtn.click();

  const cannotDeleteWarning = page.getByText("No se puede eliminar una categoría con productos relacionados");
  await expect(cannotDeleteWarning).toBeVisible();

  const closeBtn = page.getByRole("button", { name: "Cerrar" });
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(cannotDeleteWarning).not.toBeVisible();

  // Remove all products in the panel
  const removeButtons = page.getByRole("button", { name: /Quitar producto/i });
  const count = await removeButtons.count();
  for (let i = 0; i < count; i++) {
    await removeButtons.first().click();
  }

  // Save changes
  const saveChangesBtn = page.getByRole("button", { name: new RegExp(`Guardar cambios \\(${count}\\)`, "i") });
  await expect(saveChangesBtn).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/inventory/products/") &&
             res.request().method() === "PUT" &&
             [200, 201].includes(res.status())
  );

  await saveChangesBtn.click();
  await responsePromise;

  await expectSnackbar(page, "Cambios de productos extra guardados");
}

/**
 * Deletes the extra category and verifies the API and snackbar.
 * @param {import('@playwright/test').Page} page 
 */
export async function deleteExtraCategory(page) {
  const deleteCategoryBtn = page.getByRole("button", { name: "Eliminar categoría" });
  await expect(deleteCategoryBtn).toBeVisible();
  await deleteCategoryBtn.click();

  const confirmDeleteBtn = page.getByRole("button", { name: "Eliminar", exact: true });
  await expect(confirmDeleteBtn).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/inventory/categories/") &&
             res.request().method() === "DELETE" &&
             [200, 201].includes(res.status())
  );

  await confirmDeleteBtn.click();
  await responsePromise;

  await expectSnackbar(page, "Categoría extra eliminada");
}

/**
 * Tests the "Por producto" flow: relates products to a category and cleans them up.
 * @param {import('@playwright/test').Page} page 
 * @param {string} categoryName 
 * @param {string} productSearchTerm
 */
export async function testByProductFlow(page, categoryName, productSearchTerm) {
  // 1. Switch to "Por producto" section
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

        // Modal confirmation
        const confirmDeleteBtn = page.getByRole('dialog').getByRole('button', { name: /Eliminar relación/i }).last();
        await expect(confirmDeleteBtn).toBeVisible();

        const deleteResponsePromise = page.waitForResponse(
          (res) => res.url().includes("/related-extras") && res.request().method() === "DELETE" && [200, 201].includes(res.status())
        );
        await confirmDeleteBtn.click();
        await deleteResponsePromise;

        await expectSnackbar(page, /Relación eliminada/i);
        await page.waitForTimeout(500); // let UI update before checking again
      }
      
      const emptyMsg = page.getByText(/Aún no hay categorías/i);
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
    
    // Wait for the initial product list loading to finish
    const loadingIndicator = dialog.getByText(/Cargando productos disponibles/i);
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

  // Execution Flow
  await cleanupRelations();
  await relateProducts();
  await cleanupRelations();
  await relateProducts();
}
