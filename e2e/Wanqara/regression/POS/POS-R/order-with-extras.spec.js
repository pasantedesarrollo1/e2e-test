import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chefHarness, getTenantBaseUrl, requireChefCredentials } from "../../../harness/config/settings.js";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { CHEF_SESSION_PATH, ensureChefAuthenticated } from "../../../harness/helpers/chef-auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "order-with-extras.json"), "utf-8")
);

import { searchAndSelectProduct, selectTable, submitOrder } from "./harness/chef-orders-flow.js";
import {
  addInStockExtra,
  confirmExtrasAndAddToCart,
  openExtrasSelection,
  validateOutOfStockExtra
} from "./harness/pos-extras-helpers.js";
import {
  closeAllActiveOrders,
  collectOrder,
  finalizeSaleWithPayment,
  navigateToRestaurantPOS,
  openAndSelectOrder
} from "./harness/pos-orders-common.js";


for (const scenario of scenarios) {
  test.describe.serial(`Restaurant POS ${scenario.description} - Order with Extras @${scenario.metadata?.testScope || 'regression'} @release`, () => {
    requireChefCredentials(test);

    test.use({ storageState: CHEF_SESSION_PATH });

    let baseProduct = scenario.extrasData.baseProduct;
    let sinStockExtra = scenario.extrasData.sinStockExtra;
    let conStockExtra = scenario.extrasData.conStockExtra;

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test.beforeEach(async ({ page }) => {
      const chefBaseUrl = chefHarness.baseUrl;
      await ensureChefAuthenticated(page, {
        chefBaseUrl,
        targetPath: "/tables"
      });
      
      await expect(page).toHaveURL(/\/tables/);
      await expect(page.getByText(chefHarness.login.ruc).first()).toBeAttached();
      await expect(
        page.locator("ion-segment-button").filter({ hasText: "Todos" })
      ).toBeVisible();
    });

    test("selects a product and opens the modifiers sheet", async ({ page }) => {
      await selectTable(page);
      await searchAndSelectProduct(page, baseProduct);
      await openExtrasSelection(page);
    });

    test("validates out-of-stock extra shows correct labels and notifications", async ({ page }) => {
      await selectTable(page);
      await searchAndSelectProduct(page, baseProduct);
      await openExtrasSelection(page);
      await validateOutOfStockExtra(page, sinStockExtra);
    });

    test("adds an in-stock extra, completes the order, and processes payment in POS", async ({ page, browser }) => {
      test.setTimeout(180000);
      const tenantBaseUrl = getTenantBaseUrl();
      
      // Cleanup using an isolated POS context
      const cleanupContext = await browser.newContext({ storageState: getSessionPath("restaurant") });
      const cleanupPage = await cleanupContext.newPage();
      await closeAllActiveOrders(cleanupPage, tenantBaseUrl);
      await cleanupContext.close();
      
      // Use the chef page for chef actions
      const tableName = await selectTable(page);
      await searchAndSelectProduct(page, baseProduct);
      await openExtrasSelection(page);
      
      await addInStockExtra(page, conStockExtra);
      await confirmExtrasAndAddToCart(page);
      await submitOrder(page);
      
      // Create isolated POS context to collect payment
      const posContext = await browser.newContext({ storageState: getSessionPath("restaurant") });
      const posPage = await posContext.newPage();
      
      await navigateToRestaurantPOS(posPage, tenantBaseUrl);
      await openAndSelectOrder(posPage, tableName);
      await collectOrder(posPage);
      await finalizeSaleWithPayment(posPage);
      
      await posContext.close();
    });
  });
}
