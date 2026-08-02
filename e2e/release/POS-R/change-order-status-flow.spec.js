import { test } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../harness/settings.js";
import {
  createChefOrder,
  navigateToRestaurantPOS,
  navigateToChangeOrderStatusFromOptions,
} from "../harness/pos-orders-common.js";
import { 
  printPreticket 
} from "../harness/chef-orders-flow.js";
import {
  selectOrderToChangeStatus,
  processOrderStatusChange,
} from "../harness/pos-change-order-status.js";

test.describe("POS Restaurant — Change Order Status Flow @release", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test("creates an order in Chef, prints preticket, and changes status back to pending in POS", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Create order and print preticket from Chef", async () => {
      await createChefOrder(page, { tableName: "mesa 1" });
      await printPreticket(page);
    });

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open More Options menu and navigate to Change Order Status", async () => {
      await navigateToChangeOrderStatusFromOptions(page);
    });

    await test.step("Select the order", async () => {
      await selectOrderToChangeStatus(page);
    });

    await test.step("Process order status change to pending", async () => {
      await processOrderStatusChange(page);
    });
  });
});