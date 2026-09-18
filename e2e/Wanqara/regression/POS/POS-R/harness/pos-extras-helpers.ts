import { expect, type Page } from "@playwright/test";

export async function selectPosProduct(page: Page, productName: string): Promise<void> {
  const productSearch = page.getByPlaceholder(/Buscar/i);
  await expect(productSearch).toBeVisible();
  await productSearch.fill(productName);
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(1000); 
  
  const productCard = page.locator('ion-card').filter({ hasText: new RegExp(productName, "i") }).first();
  await expect(productCard).toBeVisible();
  await productCard.click();
}

export async function openExtrasSelection(page: Page, categoryName: string): Promise<void> {
  const addModifiersBtn = page.getByRole('button', { name: /Agregar informaci/i });
  await expect(addModifiersBtn).toBeVisible();
  await addModifiersBtn.click();
  
  const addExtraBtn = page.getByTestId('product-extras-open-0');
  await expect(addExtraBtn).toBeVisible();
  await addExtraBtn.click();
  
  const sheetTitle = page.getByText(new RegExp(categoryName, "i")).first();
  await expect(sheetTitle).toBeVisible();
}


export async function validateOutOfStockExtra(page: Page, extraName: string, outOfStockLabelText: string | RegExp): Promise<void> {
  const extraRow = page.getByTestId('product-extra-option').filter({ hasText: new RegExp(extraName, "i") }).first();
  
  const outOfStockLabel = extraRow.getByText(outOfStockLabelText);
  await expect(outOfStockLabel).toBeVisible();
  
  const incrementWrapper = extraRow.locator('.relative.inline-block');
  await incrementWrapper.click({ force: true });
  
  const toastMsg = page.getByText(/No hay stock disponible para/i);
  await expect(toastMsg).toBeVisible();
}

export async function addInStockExtra(page: Page, extraName: string): Promise<void> {
  const extraRow = page.getByTestId('product-extra-option')
    .filter({ hasText: new RegExp(extraName, "i") })
    .filter({ hasNotText: /Sin stock disponible/i })
    .first();
  
  const incrementBtn = extraRow.getByTestId('product-extra-increment');
  await incrementBtn.click();
  
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(500);
  
  const counterUpdated = extraRow.getByText(/^1$/, { exact: true }).first();
  await expect(counterUpdated).toBeVisible();
}


export async function confirmExtrasAndAddToCart(page: Page): Promise<void> {
  const listoBtn = page.getByTestId('product-extras-confirm');
  await expect(listoBtn).toBeVisible();
  await listoBtn.click();
  
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(500);
  
  const addBtn = page.getByTestId('product-modal-confirm');
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  
  await expect(addBtn).toBeHidden({ timeout: 5000 });
}
