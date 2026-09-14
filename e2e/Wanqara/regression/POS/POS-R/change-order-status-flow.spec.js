import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getTenantBaseUrl,
  requireChefCredentials,
  requirePosCredentials,
} from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "change-order-status-flow.json"), "utf-8")
);

import {
  printPreticket
} from "./harness/chef-orders-flow.js";
import {
  processOrderStatusChange,
  selectOrderToChangeStatus,
} from "./harness/pos-change-order-status.js";
import {
  closeAllActiveOrders,
  createChefOrder,
  navigateToChangeOrderStatusFromOptions,
  navigateToRestaurantPOS,
} from "./harness/pos-orders-common.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Change Order Status Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType), openingAmount: scenario.openingAmount });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
      const cleanupPage = await context.newPage();
      
      await closeAllActiveOrders(cleanupPage, getTenantBaseUrl(), scenario.subsidiaryName, scenario.cleanupReason || "Limpieza pre-test");
      
      await context.close();
    });

    test("creates an order in Chef, prints preticket, and changes status back to pending in POS", async ({ page, browser }) => {
      test.setTimeout(180_000);

      const tenantBaseUrl = getTenantBaseUrl();

      await test.step("Create order and print preticket from Chef", async () => {
        // Fix cross-app session invalidation by using an independent Chef context
        const chefContext = await browser.newContext({ storageState: getSessionPath("chef") });
        const chefPage = await chefContext.newPage();
        
        await createChefOrder(chefPage, { productName: scenario.productName, chefLogin: scenario.chefLogin, chefSubsidiary: scenario.chefSubsidiary });
        await printPreticket(chefPage);
        
        await chefContext.close();
      });

      await test.step("Navigate to restaurant POS", async () => {
        await navigateToRestaurantPOS(page, tenantBaseUrl, scenario.subsidiaryName);
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
}
