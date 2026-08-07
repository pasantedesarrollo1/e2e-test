import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import {
  createChefOrder,
  navigateToRestaurantPOS,
  openAndSelectOrder,
  finalizeSaleWithPayment,
  closeAllActiveOrders,
} from "./harness/pos-orders-common.js";
import {
  navigateToRemoveProducts,
  selectProductToRemove,
  confirmProductRemoval,
} from "./harness/pos-remove-products.js";

test.describe.configure({ mode: "serial" });

test.describe("POS Restaurant — Remove Products Flow @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    
    await closeAllActiveOrders(cleanupPage, getTenantBaseUrl());
    
    await context.close();
  });

  test("creates an order from Chef with 2 units", async ({ page }) => {
    test.setTimeout(120_000);
    await createChefOrder(page, { quantity: 2 });
  });

  test("removes a product from an existing order and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open orders modal and select order", async () => {
      await openAndSelectOrder(page);
    });

    await test.step("Navigate to remove products screen", async () => {
      await navigateToRemoveProducts(page);
    });

    await test.step("Select a product to remove", async () => {
      await selectProductToRemove(page, "caja de alitas");
    });

    await test.step("Confirm removal and verify POS is ready", async () => {
      await confirmProductRemoval(page);
      await expect(page.getByText(/Cliente:/i)).toBeVisible();
    });

    await test.step("Assign customer, finish sale and complete payment", async () => {
      await finalizeSaleWithPayment(page);
    });
  });
});