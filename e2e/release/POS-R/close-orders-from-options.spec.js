import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../harness/settings.js";
import {
  createChefOrder,
  navigateToRestaurantPOS,
  navigateToCloseOrderFromOptions,
} from "../harness/pos-orders-common.js";
import { processOrderClosure } from "../harness/pos-close-order.js";

test.describe("POS Restaurant — Close Orders from Options Menu @release", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test("navigates to close orders screen and closes an order, creating one first if none exist", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open More Options menu and navigate to Close Orders", async () => {
      await navigateToCloseOrderFromOptions(page);
    });

    const emptyMessage = page.getByText(/No hay órdenes disponibles/i);
    const orderCard = page.locator(".tw-border-2.tw-border-gray\\/20.tw-rounded-xl").first();

    await expect(emptyMessage.or(orderCard)).toBeVisible();

    const hasNoOrders = await emptyMessage.isVisible();

    if (hasNoOrders) {
      await test.step("No orders found — create one from Chef", async () => {
        await createChefOrder(page);
      });

      await test.step("Return to Close Orders screen", async () => {
        await navigateToRestaurantPOS(page, tenantBaseUrl);
        await navigateToCloseOrderFromOptions(page);
      });
    }

    await test.step("Select the first available order", async () => {
      await expect(orderCard).toBeVisible();
      await orderCard.click();
    });

    await test.step("Process order closure with observations", async () => {
      await processOrderClosure(page, "test");
    });
  });
});