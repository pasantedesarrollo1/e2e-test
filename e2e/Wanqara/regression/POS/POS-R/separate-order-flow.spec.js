import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import {
  createChefOrder,
  navigateToRestaurantPOS,
  openAndSelectOrder,
  finalizeSaleWithPayment,
  closeAllActiveOrders,
} from "./harness/pos-orders-common.js";
import {
  navigateToSeparateOrder,
  selectProductToSeparate,
  confirmOrderSeparation,
} from "./harness/pos-separate-order.js";

test.describe.configure({ mode: "serial" });

test.describe("POS Restaurant — Separate Order Flow @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  let activeTableName;

  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    
    await closeAllActiveOrders(cleanupPage, getTenantBaseUrl());
    
    await context.close();
  });

  test("creates an order from Chef with 2 units", async ({ page }) => {
    test.setTimeout(120_000);
    activeTableName = await createChefOrder(page, { quantity: 2 });
  });

  test("separates a product from an existing order and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open orders modal and select order", async () => {
      await openAndSelectOrder(page, activeTableName);
    });

    await test.step("Navigate to separate order screen", async () => {
      await navigateToSeparateOrder(page);
    });

    await test.step("Select a product to separate", async () => {
      await selectProductToSeparate(page, SEED.products.estandar.name);
    });

    await test.step("Confirm separation and verify POS is ready", async () => {
      await confirmOrderSeparation(page);
      await expect(page.getByText(/Cliente:/i)).toBeVisible();
    });

    await test.step("Assign customer, finish sale and complete payment", async () => {
      await finalizeSaleWithPayment(page);
    });
  });
});