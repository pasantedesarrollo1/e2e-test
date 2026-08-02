import { expect } from "@playwright/test";

export async function selectTable(page, tableName) {
  const tableCard = page.getByRole("button", { name: new RegExp(tableName, "i") });
  await expect(tableCard).toBeVisible();
  await tableCard.click();
}

export async function searchAndSelectProduct(page, productName) {
  const productsTab = page.getByRole("tab", { name: "Productos" });
  await expect(productsTab).toBeVisible();
  await productsTab.click();

  const searchbar = page.getByPlaceholder("Buscar productos...");
  await expect(searchbar).toBeVisible();
  await searchbar.click();
  await searchbar.fill(productName);

  const productButton = page.getByRole("button", { name: new RegExp(productName, "i") }).first();
  await expect(productButton).toBeVisible();
  await productButton.click();
}

export async function addProductToCart(page, quantity = 1) {
  const addButton = page.getByRole("button", { name: "Agregar", exact: true });
  await expect(addButton).toBeVisible();

  if (quantity > 1) {
    const incrementButton = page.locator('.relative.inline-block > .md');
    await expect(incrementButton).toBeVisible();
    for (let i = 1; i < quantity; i++) {
      await incrementButton.click();
    }
  }

  await addButton.click();
  await expect(addButton).toBeHidden();
}

export async function submitOrder(page) {
  const cartTab = page.getByRole("tab", { name: /Carrito/i });
  await expect(cartTab).toBeVisible();
  await cartTab.click();

  const submitButton = page.getByRole("button", { name: /Agregar a la orden|Terminar orden/i });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/restaurant/orders") &&
      ["PATCH", "POST"].includes(res.request().method()) &&
      [200, 201].includes(res.status()),
    { timeout: 30000 }
  );

  await submitButton.click();
  await responsePromise;

  const successMessage = page.getByText(/Productos agregados correctamente|Orden enviada correctamente/i);
  await expect(successMessage).toBeVisible();

  const continueButton = page.getByRole("button", { name: /Continuar/i });
  await expect(continueButton).toBeVisible();
  await continueButton.click();

  await expect(continueButton).not.toBeVisible();

  await expect(page.getByText(/Detalle de consumo/i)).toBeVisible({ timeout: 30000 });
}

export async function printPreticket(page) {
  const printIcon = page.locator('.icon-\\[lucide--printer\\]:visible').first();
  
  await expect(printIcon).toBeVisible();
  await printIcon.click();

  const acceptButton = page.getByRole('button', { name: 'Aceptar' });
  await expect(acceptButton).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/restaurant/orders/") &&
      res.url().includes("/update-status") &&
      res.request().method() === "PATCH" &&
      res.status() === 200,
    { timeout: 30000 }
  );

  await acceptButton.click();
  await responsePromise;
}