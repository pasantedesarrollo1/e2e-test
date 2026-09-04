import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/annotate.js";
import { requirePosCredentials, requireChefCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import { runReleasePosSaleFlow, finalizeValidatedRestaurantSale } from "../harness/pos-cross-sale-flow.js";
import { createChefOrder, navigateToRestaurantPOS, openAndSelectOrder, closeAllActiveOrders } from "../POS-R/harness/pos-orders-common.js";

const TICKET = {
  ws: 'WS-1004',
  tes: 'TES-213',
  release: 'v7.9.1',
  summary: 'POS Sales with Sequential Validation',
  addedToRegression: 'true',
};

const tenantBaseUrl = getTenantBaseUrl();

test.describe("POS Sales — Sequential Validation @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test.describe("Commerce 100", () => {
    test.use({ storageState: getSessionPath("retail") });

    test("POS sale in branch 100 with receipts", async ({ page }) => {
      test.setTimeout(120_000);
      await runReleasePosSaleFlow(page, tenantBaseUrl, SEED.documentTypes.recibos);
    });
  });

  test.describe("Commerce Dispatch 101", () => {
    test.use({ storageState: getSessionPath("dispatch") });

    test("POS sale in branch 101 with receipts", async ({ page }) => {
      test.setTimeout(120_000);
      await runReleasePosSaleFlow(page, tenantBaseUrl, SEED.documentTypes.recibos);
    });
  });
});

test.describe.serial("POS Restaurant — Sale with Electronic Invoice @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    await closeAllActiveOrders(cleanupPage, tenantBaseUrl);
    await context.close();
  });

  test("Creates order in Chef and charges it verifying access_key", async ({ page }) => {
    test.setTimeout(180_000);
    const activeTableName = await createChefOrder(page);
    await navigateToRestaurantPOS(page, tenantBaseUrl);
    await openAndSelectOrder(page, activeTableName);
    
    const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar pago/i }).first();
    await cobrarBtn.click();
    
    await finalizeValidatedRestaurantSale(page);
  });
});