import { expect } from "@playwright/test";
import { expectSnackbar } from "../../../../harness/ui-helpers.js";
import { SEED } from "../../../../harness/seed.js";

/**
 * Selects a product from the POS list.
 * @param {import('@playwright/test').Page} page 
 * @param {string} productName 
 */
export async function selectPosProduct(page, productName) {
  const productSearch = page.getByPlaceholder(/Buscar/i);
  await expect(productSearch).toBeVisible();
  await productSearch.fill(productName);
  await page.waitForTimeout(1000); // Wait for debounce/search
  
  // Wait for network response if there's one, or just click the first match
  const productCard = page.locator('ion-card').filter({ hasText: new RegExp(productName, "i") }).first();
  await expect(productCard).toBeVisible();
  await productCard.click();
}

/**
 * Opens the Extras Selection Sheet from the Product Modifiers view.
 * @param {import('@playwright/test').Page} page 
 */
export async function openExtrasSelection(page) {
  const addModifiersBtn = page.getByRole('button', { name: /Agregar informaci/i });
  await expect(addModifiersBtn).toBeVisible();
  await addModifiersBtn.click();
  
  // Use the testid to specifically click the Extras "Agregar" button (and not Observations)
  const addExtraBtn = page.getByTestId('product-extras-open-0');
  await expect(addExtraBtn).toBeVisible();
  await addExtraBtn.click();
  
  // Verify sheet opened
  const categoryName = SEED.extrasManager.category.name;
  const sheetTitle = page.getByText(new RegExp(categoryName, "i")).first();
  await expect(sheetTitle).toBeVisible();
}

/**
 * Validates that an out-of-stock extra shows the correct label and shows a toast when clicked.
 * @param {import('@playwright/test').Page} page 
 * @param {string} extraName 
 */
export async function validateOutOfStockExtra(page, extraName) {
  // Find the specific extra option row
  const extraRow = page.getByTestId('product-extra-option').filter({ hasText: new RegExp(extraName, "i") }).first();
  
  // Verify label
  const outOfStockLabel = extraRow.getByText(SEED.extrasManager.messages.outOfStockLabel);
  await expect(outOfStockLabel).toBeVisible();
  
  // Click the increment wrapper which has the @click event
  const incrementWrapper = extraRow.locator('.relative.inline-block');
  await incrementWrapper.click({ force: true });
  
  // Verify toast/snackbar
  const toastMsg = page.getByText(/No hay stock disponible para/i);
  await expect(toastMsg).toBeVisible();
}

/**
 * Adds an in-stock extra and validates the counter increases.
 * @param {import('@playwright/test').Page} page 
 * @param {string} extraName 
 */
export async function addInStockExtra(page, extraName) {
  // Find the specific extra option row
  const extraRow = page.getByTestId('product-extra-option')
    .filter({ hasText: new RegExp(extraName, "i") })
    .filter({ hasNotText: /Sin stock disponible/i })
    .first();
  
  // Click the increment button inside that row
  const incrementBtn = extraRow.getByTestId('product-extra-increment');
  await incrementBtn.click();
  
  // Wait for UI to update
  await page.waitForTimeout(500);
  
  // Verify counter is now 1 inside this row
  const counterUpdated = extraRow.getByText(/^1$/, { exact: true }).first();
  await expect(counterUpdated).toBeVisible();
}

/**
 * Confirms the extras selection and adds the product to the order.
 * @param {import('@playwright/test').Page} page 
 */
export async function confirmExtrasAndAddToCart(page) {
  const listoBtn = page.getByTestId('product-extras-confirm');
  await expect(listoBtn).toBeVisible();
  await listoBtn.click();
  
  // Wait for it to close
  await page.waitForTimeout(500);
  
  // We are back at ProductModifiers.vue, click "Agregar" at the bottom
  const addBtn = page.getByTestId('product-modal-confirm');
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  
  // Wait for product modifiers sheet to close
  await expect(addBtn).toBeHidden({ timeout: 5000 });
}
