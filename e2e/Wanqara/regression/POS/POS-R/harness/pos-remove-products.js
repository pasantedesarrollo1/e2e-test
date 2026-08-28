import { expect } from "@playwright/test";

export async function navigateToRemoveProducts(page) {
  const removeBtn = page.getByRole("button", { name: /Quitar Productos/i }).first();
  await expect(removeBtn).toBeVisible();
  await removeBtn.click();
  await page.waitForURL(/\/pos\/separate-order\/.*\/remove/);
}

export async function selectProductToRemove(page, productName) {
  const productCard = page
    .locator(".tw-cursor-pointer")
    .filter({ hasText: productName })
    .first();   
  await expect(productCard).toBeVisible();
  await productCard.click();
}

export async function confirmProductRemoval(page) {
  const submitBtn = page.getByRole("button", { name: "Quitar Productos", exact: true });
  await expect(submitBtn).toBeEnabled();

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/pos/categories") &&
      res.request().method() === "GET" &&
      res.status() === 200
  );

  await submitBtn.click();
  await responsePromise;
}