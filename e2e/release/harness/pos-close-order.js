import { expect } from "@playwright/test";

export async function navigateToCloseOrder(page) {
  const closeOrderBtn = page.getByRole("button", { name: /Cerrar Orden/i }).filter({ hasText: /Finalizar orden/i }).first();
  await expect(closeOrderBtn).toBeVisible();
  await closeOrderBtn.click();
  await page.waitForURL(/\/pos\/close-restaurant-order\//);
}

export async function processOrderClosure(page, observation) {
  const observationInput = page.getByPlaceholder(/Ingresa las observaciones/i);
  await expect(observationInput).toBeVisible();
  await observationInput.fill(observation);

  const submitCloseBtn = page.getByRole("button", { name: "Cerrar Orden", exact: true });
  await expect(submitCloseBtn).toBeEnabled();
  await submitCloseBtn.click();

  const confirmBtn = page.getByRole("button", { name: /Confirmar Cierre/i });
  await expect(confirmBtn).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/pos/orders/") &&
      res.url().endsWith("/close") &&
      res.request().method() === "POST" &&
      res.status() === 200
  );

  await confirmBtn.click();
  await responsePromise;

  const successMessage = page.getByText(/Orden cerrada con éxito/i);
  await expect(successMessage).toBeVisible();
}