import { test } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import {
  withActiveRestaurantOrder,
} from "./harness/pos-orders-common.js";
import {
  navigateToCloseOrder,
  processOrderClosure,
} from "./harness/pos-close-order.js";

test.describe("POS Restaurant — Close Orders @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("closes an existing order from the POS", async ({ page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await withActiveRestaurantOrder(page, tenantBaseUrl, async (page, activeTableName) => {
      await test.step("Navigate to close order screen", async () => {
        await navigateToCloseOrder(page);
      });

      await test.step("Process order closure with observations", async () => {
        await processOrderClosure(page, SEED.restaurant.closeReason);
      });
    });
  });
});