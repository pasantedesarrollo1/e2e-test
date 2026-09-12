import { expect } from "@playwright/test";
import { expectSnackbar } from "../../../../../harness/helpers/ui-helpers.js";
import { SEED } from "../../../../../harness/config/seed.js";

/**
 * Creates an extra category using the UI.
 * @param {import('@playwright/test').Page} page 
 * @param {string} categoryName 
 */
export async function createExtraCategory(page, categoryName) {
  const categoriesTab = page.getByRole('button', { name: /Categor.as/i });
  if (await categoriesTab.isVisible()) {
    await categoriesTab.click();
  }

  const createCategoryBtn = page.getByRole('button', { name: /Nueva categor.a extra/i });
  await expect(createCategoryBtn).toBeVisible();
  await createCategoryBtn.click();

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

  await expectSnackbar(page, SEED.extrasManager.messages.categoryCreated);
}

/**
 * Assigns products to an extra category.
 * @param {import('@playwright/test').Page} page 
 * @param {string} categoryName 
 * @param {string} productSearchTerm
 * @param {string[]} productNamesToSelect
 */
export async function assignProductsToExtraCategory(page, categoryName, productSearchTerm, productNamesToSelect) {
  const categorySearchInput = page.getByPlaceholder(/Buscar categor.a/i);
  await expect(categorySearchInput).toBeVisible();
  await categorySearchInput.fill(categoryName);

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
  await responsePromise;
  
  await expectSnackbar(page, SEED.extrasManager.messages.changesSaved);
}

/**
 * Validates that a category with products cannot be deleted,
 * then removes all its products and saves.
 * @param {import('@playwright/test').Page} page 
 */
export async function verifyDeletionConstraintsAndRemoveProducts(page) {
  const deleteCategoryBtn = page.getByRole("button", { name: /Eliminar categor.a/i });
  await expect(deleteCategoryBtn).toBeVisible();
  await deleteCategoryBtn.click();

  const cannotDeleteWarning = page.getByText(SEED.extrasManager.messages.cannotDelete);
  await expect(cannotDeleteWarning).toBeVisible();

  const closeBtn = page.getByRole("button", { name: "Cerrar" });
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(cannotDeleteWarning).not.toBeVisible();

  const removeButtons = page.getByRole("button", { name: /Quitar producto/i });
  const count = await removeButtons.count();
  for (let i = 0; i < count; i++) {
    await removeButtons.first().click();
  }

  const saveChangesBtn = page.getByRole("button", { name: new RegExp(`Guardar cambios \\(${count}\\)`, "i") });
  await expect(saveChangesBtn).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/inventory/products/") &&
             res.request().method() === "PUT" &&
             [200, 201].includes(res.status())
  );

  await saveChangesBtn.click();
  await responsePromise;

  await expectSnackbar(page, SEED.extrasManager.messages.changesSaved);
}

/**
 * Deletes the extra category and verifies the API and snackbar.
 * @param {import('@playwright/test').Page} page 
 */
export async function deleteExtraCategory(page) {
  const deleteCategoryBtn = page.getByRole("button", { name: /Eliminar categor.a/i });
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

  await expectSnackbar(page, SEED.extrasManager.messages.categoryDeleted);
}
