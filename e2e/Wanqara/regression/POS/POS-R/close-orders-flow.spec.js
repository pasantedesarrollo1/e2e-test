import { test } from "@playwright/test";
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
  closeAllActiveOrders,
} from "./harness/pos-orders-common.js";
import {
  navigateToCloseOrder,
  processOrderClosure,
} from "./harness/pos-close-order.js";

test.describe.configure({ mode: "serial" });

test.describe("POS Restaurant — Close Orders @regression", () => {
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

  test("creates a new order from Chef for closure", async ({ page }) => {
    test.setTimeout(120_000);
    activeTableName = await createChefOrder(page);
  });

  test("closes an existing order from the POS", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open orders modal and select order", async () => {
      await openAndSelectOrder(page, activeTableName);
    });

    await test.step("Navigate to close order screen", async () => {
      await navigateToCloseOrder(page);
    });

    await test.step("Process order closure with observations", async () => {
      await processOrderClosure(page, SEED.restaurant.closeReason);
    });
  });
});