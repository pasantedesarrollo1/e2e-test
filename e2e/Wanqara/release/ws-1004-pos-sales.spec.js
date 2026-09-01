import { test } from "@playwright/test";
import { requirePosCredentials, requireChefCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath } from "../harness/auth.js";
import { SEED } from "../harness/seed.js";
import { runReleasePosSaleFlow, finalizeValidatedRestaurantSale } from "./herness/ws-1004-pos-flow.js";
import { createChefOrder, navigateToRestaurantPOS, openAndSelectOrder, closeAllActiveOrders } from "../regression/POS/POS-R/harness/pos-orders-common.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("ws-1004-pos-sales: POS Sales with Sequential Validation @release", () => {
  requirePosCredentials(test);

  test.describe("Commerce 100", () => {
    test.use({ storageState: getSessionPath("retail") });

    test("ws-1004-pos-retail: POS sale in branch 100 with receipts", async ({ page }) => {
      test.setTimeout(120_000);
      await runReleasePosSaleFlow(page, tenantBaseUrl, SEED.documentTypes.recibos);
    });
  });

  test.describe("Commerce Dispatch 101", () => {
    test.use({ storageState: getSessionPath("dispatch") });

    test("ws-1004-pos-dispatch: POS sale in branch 101 with receipts", async ({ page }) => {
      test.setTimeout(120_000);
      await runReleasePosSaleFlow(page, tenantBaseUrl, SEED.documentTypes.recibos);
    });
  });
});

test.describe.serial("ws-1004-pos-restaurant: POS Restaurant Sale with Electronic Invoice @release", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    await closeAllActiveOrders(cleanupPage, tenantBaseUrl);
    await context.close();
  });

  test("ws-1004-pos-restaurant: Creates order in Chef and charges it verifying access_key", async ({ page }) => {
    test.setTimeout(180_000);
    
    // 1. Chef
    const activeTableName = await createChefOrder(page);

    // 2. POS
    await navigateToRestaurantPOS(page, tenantBaseUrl);
    await openAndSelectOrder(page, activeTableName);
    
    const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar pago/i }).first();
    await cobrarBtn.click();
    
    // 3. Finalize and intercept (Using Electronic Invoicing by default in seed config)
    await finalizeValidatedRestaurantSale(page);
  });
});