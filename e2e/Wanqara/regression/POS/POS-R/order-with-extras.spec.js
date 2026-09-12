import { test, expect } from "@playwright/test";
import { requireChefCredentials, chefHarness, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { ensureChefAuthenticated, CHEF_SESSION_PATH } from "../../../harness/helpers/chef-auth.js";
import { SEED } from "../../../harness/config/seed.js";
import { 
  openExtrasSelection, 
  validateOutOfStockExtra, 
  addInStockExtra, 
  confirmExtrasAndAddToCart 
} from "./harness/pos-extras-helpers.js";
import { selectTable, searchAndSelectProduct, submitOrder } from "./harness/chef-orders-flow.js";
import { 
  navigateToRestaurantPOS, 
  openAndSelectOrder, 
  collectOrder, 
  finalizeSaleWithPayment,
  closeAllActiveOrders
} from "./harness/pos-orders-common.js";

const TICKET = {
  ws: null,
  tes: 'TES-214',
  release: 'v7.10.0',
  summary: 'Implementar test de creacion de categoria extra',
  addedToRegression: 'true',
};

test.describe.serial("Restaurant POS - Order with Extras @release", () => {
  requireChefCredentials(test);

  test.use({ storageState: CHEF_SESSION_PATH });

  let baseProduct;
  let sinStockExtra;
  let conStockExtra;

  test.beforeAll(() => {
    baseProduct = SEED.extrasManager.products.baseProduct;
    sinStockExtra = SEED.extrasManager.products.items.sinStock.name;
    conStockExtra = SEED.extrasManager.products.items.conStock.name;
  });

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
    
    // Open the extras selection
    await openExtrasSelection(page);
  });

  test("validates out-of-stock extra shows correct labels and notifications", async ({ page }) => {
    await selectTable(page);
    await searchAndSelectProduct(page, baseProduct);
    await openExtrasSelection(page);
    
    await validateOutOfStockExtra(page, sinStockExtra);
  });

  test("adds an in-stock extra, completes the order, and processes payment in POS", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    await closeAllActiveOrders(page, tenantBaseUrl);
    
    // Now we must ensure we are back in the chef view
    const chefBaseUrl = chefHarness.baseUrl;
    await ensureChefAuthenticated(page, { chefBaseUrl, targetPath: "/tables" });
    
    const tableName = await selectTable(page);
    await searchAndSelectProduct(page, baseProduct);
    await openExtrasSelection(page);
    
    await addInStockExtra(page, conStockExtra);
    await confirmExtrasAndAddToCart(page);
    await submitOrder(page);
    
    // Now switch to the POS and collect the payment
    await navigateToRestaurantPOS(page, tenantBaseUrl);
    
    // Open the pending order
    await openAndSelectOrder(page, tableName);
    
    // Collect order and finalize payment
    await collectOrder(page);
    await finalizeSaleWithPayment(page);
    
    // Verify successful payment (e.g., success snackbar or preticket dialog)
    // The finalizeSaleWithPayment helper waits for the payment to complete
  });
});
