import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { SEED } from "../../../harness/config/seed.js";
import {
  finalizeSaleWithPayment,
  withActiveRestaurantOrder,
} from "./harness/pos-orders-common.js";
import {
  navigateToRemoveProducts,
  selectProductToRemove,
  confirmProductRemoval,
} from "./harness/pos-remove-products.js";

test.describe("POS Restaurant — Remove Products Flow @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("removes a product from an existing order and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await withActiveRestaurantOrder(page, tenantBaseUrl, async (page, activeTableName) => {
      await test.step("Navigate to remove products screen", async () => {
        await navigateToRemoveProducts(page);
      });

      await test.step("Select a product to remove", async () => {
        await selectProductToRemove(page, SEED.products.estandar.name);
      });

      await test.step("Confirm removal and verify POS is ready", async () => {
        await confirmProductRemoval(page);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();
      });

      await test.step("Assign customer, finish sale and complete payment", async () => {
        await finalizeSaleWithPayment(page);
      });
    }, { quantity: 2 });
  });
});
