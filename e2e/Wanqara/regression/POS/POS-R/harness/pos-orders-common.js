import { expect } from "@playwright/test";
import { chefHarness, playwrightHarness } from "../../../../harness/config/settings.js";
import { ensureAuthenticated, loginAndSelectSubsidiary } from "../../../../harness/helpers/auth/auth.js";
import { ensureChefAuthenticated } from "../../../../harness/helpers/auth/chef-auth.js";
import { selectClientByCedula } from '../../../../harness/helpers/people/client-helpers.js';
import { expectSnackbar } from "../../../../harness/helpers/ui/ui-helpers.js";
import { completePayment } from "../../harness/payments/pos-payment.js";
import { openDrawer } from '../../harness/sales/pos-drawer-helpers.js';
import {
  addProductToCart,
  searchAndSelectProduct,
  selectTable,
  submitOrder,
} from "./chef-orders-flow.js";
import { processOrderClosure } from "./pos-close-order.js";

export async function navigateToRestaurantPOS(page, subsidiaryName) {
  if (!subsidiaryName) throw new Error("navigateToRestaurantPOS requires subsidiaryName parameter");
  await ensureAuthenticated(page, {
      targetPath: "/pos/restaurant-home",
      authType: "restaurant" 
    });

  const clienteLabel = page.getByText(/Cliente:/i);
  const loginBtn = page.getByRole("button", { name: /Iniciar/i });

  await expect(clienteLabel.or(loginBtn)).toBeVisible({ timeout: 60_000 });

  if (await loginBtn.isVisible()) {
    await loginAndSelectSubsidiary(page, {
      login: playwrightHarness.users.restaurant,
      subsidiaryName,
    });
    await page.goto("/pos/restaurant-home");
    await expect(clienteLabel).toBeVisible({ timeout: 60_000 });
  }
}

export async function createChefOrder(page, {
  productName,
  quantity = 1,
  chefLogin,
  chefSubsidiary,
  chefSubsidiaryCode
} = {}) {
  if (!productName) throw new Error("createChefOrder requires productName in options");
  await ensureChefAuthenticated(page, {
    chefBaseUrl: chefHarness.baseUrl,
    targetPath: "/tables",
    login: chefLogin,
    subsidiary: chefSubsidiary,
    subsidiaryCode: chefSubsidiaryCode
  });

  await expect(page).toHaveURL(/\/tables/);

  await expect(
    page.locator("ion-segment-button").filter({ hasText: "Todos" })
  ).toBeVisible();

  const tableName = await selectTable(page);
  await searchAndSelectProduct(page, productName);
  await addProductToCart(page, quantity);
  await submitOrder(page);

  return tableName;
}

export async function finalizeSaleWithPayment(page, cedula, paymentMethod) {
  if (!cedula) throw new Error("finalizeSaleWithPayment requires cedula parameter");
  if (!paymentMethod) throw new Error("finalizeSaleWithPayment requires paymentMethod parameter");
  await selectClientByCedula(page, cedula);

  const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
  await finishSaleButton.click();
  await page.waitForURL(/\/pos\/restaurant-payments/);

  await completePayment(page, { paymentMethod });
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

  await expectSnackbar(page, /Orden actualizada con éxito/i);
}

export async function collectOrder(page) {
  const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar Pago/i }).first();
  // Fallback in case the exact accessible name doesn't include both, we can just use the button that has 'Cobrar' but not 'pedidos'
  const fallbackBtn = page.getByRole("button", { name: /^Cobrar( Orden)?$/i });
  
  await expect(cobrarBtn.or(fallbackBtn)).toBeVisible();
  if (await cobrarBtn.isVisible()) {
    await cobrarBtn.click();
  } else {
    await fallbackBtn.click();
  }
}

export async function navigateToCloseOrderFromOptions(page) {
  const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
  const drawerFilter = /Opciones/i;

  const drawer = await openDrawer(page, triggerLocator, drawerFilter);

  const closeOrderOption = drawer
    .getByRole("button", { name: /Cerrar Ordenes/i })
    .first();
    
  await expect(closeOrderOption).toBeVisible();
  await closeOrderOption.click({ force: true }); 

  await page.waitForURL(/\/pos\/close-restaurant-order/);
}

export async function openAndSelectOrder(page, tableName) {
  const cobrarBtn = page.getByRole("button", { name: /Cobrar pedidos/i });
  await expect(cobrarBtn).toBeVisible();
  await cobrarBtn.click({ force: true });

  const orderCard = page
    .locator(".order-card")
    .filter({ hasText: new RegExp(tableName, "i") })
    .first();

  await expect(orderCard).toBeVisible({ timeout: 20000 });
  await orderCard.click({ force: true });
}

export async function navigateToChangeOrderStatusFromOptions(page) {
  const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
  await expect(triggerLocator).toBeVisible({ timeout: 15000 });
  
  const drawerFilter = /Opciones/i;

  const drawer = await openDrawer(page, triggerLocator, drawerFilter);

  const changeStatusOption = page.getByRole("button", { name: /Cambiar Estado de Ordenes/i }).first();

  await drawer.hover();
  for (let i = 0; i < 5; i++) {
    if (await changeStatusOption.isVisible()) break;
    await page.mouse.wheel(0, 600); 
    try { await changeStatusOption.waitFor({ state: "visible", timeout: 500 }); break; } catch { /* Ignore timeout, try scrolling again */ }
  }

  await expect(changeStatusOption).toBeVisible();
  await changeStatusOption.click();

  await page.waitForURL(/\/pos\/change-order-status/);
}

export async function closeAllActiveOrders(page, subsidiaryName, reason) {
  if (!reason) throw new Error("closeAllActiveOrders requires a reason parameter");
  await navigateToRestaurantPOS(page, subsidiaryName);

  while (true) {
    await navigateToCloseOrderFromOptions(page);

    const emptyMessage = page.getByText(/No hay órdenes disponibles/i);
    const orderCard = page.locator(".tw-border-2.tw-border-gray\\/20.tw-rounded-xl").first();

    await expect(emptyMessage.or(orderCard)).toBeVisible({ timeout: 15000 });

    if (await emptyMessage.isVisible()) {
      await page.goto("/pos/restaurant-home");
      break;
    }

    await orderCard.click();
    await processOrderClosure(page, reason);

    await page.goto("/pos/restaurant-home");
  }
}

export async function withActiveRestaurantOrder(page, actionCallback, orderOptions = {}, posOptions = {}) {
  await closeAllActiveOrders(page, posOptions.subsidiaryName, posOptions.cleanupReason);
  const activeTableName = await createChefOrder(page, orderOptions);
  await navigateToRestaurantPOS(page, posOptions.subsidiaryName);
  await openAndSelectOrder(page, activeTableName);
  await actionCallback(page, activeTableName);
}
