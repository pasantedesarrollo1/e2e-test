import { expect, type Page } from "@playwright/test";

export async function navigateToSeparateOrder(page: Page): Promise<void> {
  const separateBtn = page.getByRole("button", { name: /Cobro Parcial/i }).first();
  await expect(separateBtn).toBeVisible();
  await separateBtn.click();
    await page.waitForURL(/\/pos\/separate-order\/.*\/partial/);
}

export async function selectProductToSeparate(page: Page, productName: string): Promise<void> {
  const productCard = page
    .locator(".tw-cursor-pointer")
    .filter({ hasText: productName })
    .first();
  await expect(productCard).toBeVisible();
  await productCard.click();
}

export async function confirmOrderSeparation(page: Page): Promise<void> {
  const submitBtn = page.getByRole("button", { name: "Separar Orden", exact: true });
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();
  
  await page.waitForURL(/\/pos\/restaurant-home/);
}