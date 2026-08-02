import { expect } from "@playwright/test";

import { ensureAuthenticated, loginAndSelectSubsidiary } from "../../harness/auth.js";
import { ensureChefAuthenticated } from "../../harness/chef-auth.js";
import { chefHarness, playwrightHarness } from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import {
  selectTable,
  searchAndSelectProduct,
  addProductToCart,
  submitOrder,
} from "./chef-orders-flow.js";
import { selectClientByCedula, openDrawer } from "../../regression/harness/pos-sale-flow.js";
import { completePayment } from "../../regression/harness/pos-payment.js";

export async function navigateToRestaurantPOS(page, tenantBaseUrl) {
  await ensureAuthenticated(page, {
    tenantBaseUrl,
    targetPath: "/pos/restaurant-home",
  });

  const clienteLabel = page.getByText(/Cliente:/i);
  const loginBtn = page.getByRole("button", { name: /Iniciar/i });

  await expect(clienteLabel.or(loginBtn)).toBeVisible({ timeout: 60_000 });

  if (await loginBtn.isVisible()) {
    await loginAndSelectSubsidiary(page, {
      tenantBaseUrl,
      login: playwrightHarness.login,
      subsidiaryName: SEED.subsidiary.name,
    });
    await page.goto(`${tenantBaseUrl}/pos/restaurant-home`);
    await expect(clienteLabel).toBeVisible({ timeout: 60_000 });
  }
}

export async function openAndSelectOrder(page, tableName = "mesa 1") {
  await page.getByRole("button", { name: /Cobrar pedidos/i }).click();

  const orderCard = page
    .locator(".order-card")
    .filter({ hasText: new RegExp(tableName, "i") })
    .first();

  await expect(orderCard).toBeVisible();
  await orderCard.click();
}

export async function createChefOrder(page, {
  tableName   = "mesa 1",
  productName = "caja de alitas",
  quantity    = 1,
} = {}) {
  await ensureChefAuthenticated(page, {
    chefBaseUrl: chefHarness.baseUrl,
    targetPath: "/tables",
  });

  await expect(page).toHaveURL(/\/tables/);
  await expect(page.getByText(chefHarness.login.ruc).first()).toBeAttached();
  await expect(
    page.locator("ion-segment-button").filter({ hasText: "Todos" })
  ).toBeVisible();

  await selectTable(page, tableName);
  await searchAndSelectProduct(page, productName);
  await addProductToCart(page, quantity);
  await submitOrder(page);
}

export async function finalizeSaleWithPayment(page) {
  await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);

  const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
  await finishSaleButton.click();
  await page.waitForURL(/\/pos\/restaurant-payments/);

  await completePayment(page);
}

export async function addProductToExistingOrder(page, productName) {
  await page.getByRole("button", { name: /Agregar Productos/i }).click();

  const searchInput = page.getByRole("textbox", {
    name: /Buscar producto por nombre/i,
  });
  await expect(searchInput).toBeVisible();
  await searchInput.click();

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/inventory/products") &&
        res.request().method() === "GET" &&
        res.status() === 200,
    ),
    searchInput.pressSequentially(productName, { delay: 50 }),
  ]);

  const productResult = page
    .locator(".v-overlay-container .v-overlay--active .v-list-item")
    .filter({ hasText: productName })
    .first();

  await expect(productResult).toBeVisible({ timeout: 15_000 });
  await productResult.click();

  await page.getByRole("button", { name: /Guardar Cambios/i }).click();

  const confirmDialog = page
    .locator(".v-dialog")
    .filter({ hasText: /Confirmar Actualización/i })
    .first();
  await expect(confirmDialog).toBeVisible();

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/restaurant/orders/") &&
        res.request().method() === "PATCH" &&
        res.status() === 200,
    ),
    page.getByRole("button", { name: /Confirmar/i }).click(),
  ]);

  await expect(
    page
      .locator(".v-snackbar")
      .filter({ hasText: /Orden actualizada con éxito/i })
      .first(),
  ).toBeVisible();
}

export async function collectOrder(page) {
  await page.getByRole("button", { name: /Cobrar Orden/i }).click();
}

export async function navigateToCloseOrderFromOptions(page) {
  const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
  const drawerFilter = /Opciones/i;

  const drawer = await openDrawer(page, triggerLocator, drawerFilter);

  const closeOrderOption = drawer
    .getByRole("button", { name: /Cerrar Ordenes/i })
    .first();
  await expect(closeOrderOption).toBeVisible();
  await closeOrderOption.click();

  await page.waitForURL(/\/pos\/close-restaurant-order/);
}

export async function navigateToChangeOrderStatusFromOptions(page) {
  await page.waitForTimeout(1500);

  const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
  const drawerFilter = /Opciones/i;

  const drawer = await openDrawer(page, triggerLocator, drawerFilter);

  const changeStatusOption = page.getByRole("button", { name: /Cambiar Estado de Ordenes/i }).first();

  await drawer.hover();
  for (let i = 0; i < 5; i++) {
    if (await changeStatusOption.isVisible()) break;
    await page.mouse.wheel(0, 600); 
    await page.waitForTimeout(300); 
  }

  await expect(changeStatusOption).toBeVisible();
  await changeStatusOption.click();

  await page.waitForURL(/\/pos\/change-order-status/);
}