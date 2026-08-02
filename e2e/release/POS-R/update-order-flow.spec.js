import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import {
  navigateToRestaurantPOS,
  openAndSelectOrder,
  addProductToExistingOrder,
  collectOrder,
} from "../harness/pos-orders-common.js";
import { completePayment } from "../../regression/harness/pos-payment.js";

test.describe("POS Restaurant — Update Order Flow @release", () => {
  requirePosCredentials(test);

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