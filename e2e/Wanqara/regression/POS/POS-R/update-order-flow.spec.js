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
  addProductToExistingOrder,
  collectOrder,
  closeAllActiveOrders,
} from "./harness/pos-orders-common.js";
import { completePayment } from "../harness/pos-payment.js";

test.describe.configure({ mode: "serial" });

test.describe("POS Restaurant — Update Order Flow @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    
    await closeAllActiveOrders(cleanupPage, getTenantBaseUrl());
    
    await context.close();
  });

  test("creates a new order from Chef", async ({ page }) => {
    test.setTimeout(120_000);
    await createChefOrder(page);
  });

  test("adds a product to an existing order and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open orders modal and select order", async () => {
      await openAndSelectOrder(page);
    });

    await test.step("Add a product to the existing order", async () => {
      await addProductToExistingOrder(page, "Caja de alitas de pollo (100 u)");
    });

    await test.step("Collect order and verify payments screen", async () => {
      await collectOrder(page);
      await page.waitForURL(/\/pos\/restaurant-payments/);
      await expect(page.getByText(/Cliente:/i)).toBeVisible();
    });

    await test.step("Complete the payment process", async () => {
      await completePayment(page);
    });
  });
});