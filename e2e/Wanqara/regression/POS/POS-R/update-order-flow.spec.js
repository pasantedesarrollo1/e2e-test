import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import {
  addProductToExistingOrder,
  collectOrder,
  withActiveRestaurantOrder,
} from "./harness/pos-orders-common.js";
import { completePayment } from "../harness/pos-payment.js";

test.describe("POS Restaurant — Update Order Flow @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("adds a product to an existing order and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await withActiveRestaurantOrder(page, tenantBaseUrl, async (page, activeTableName) => {
      await test.step("Add a product to the existing order", async () => {
        await addProductToExistingOrder(page, SEED.products.estandar.name);
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
});