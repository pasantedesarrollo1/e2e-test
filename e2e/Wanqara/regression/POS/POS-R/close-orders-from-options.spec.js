import { getChefSessionPath } from "../../../harness/helpers/auth/chef-auth.js";
import { expect, test } from "@playwright/test";
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
  fs.readFileSync(path.join(__dirname, "0-json-data", "close-orders-from-options.json"), "utf-8")
);

import { processOrderClosure } from "./harness/pos-close-order.js";
import {
  closeAllActiveOrders,
  createChefOrder,
  navigateToCloseOrderFromOptions,
  navigateToRestaurantPOS,
} from "./harness/pos-orders-common.js";

for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Close Orders from Options Menu @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType), openingAmount: scenario.openingAmount, authType: scenario.authType, loginMode: scenario.loginMode});

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
      const cleanupPage = await context.newPage();
      
      await closeAllActiveOrders(cleanupPage, getTenantBaseUrl(), scenario.subsidiaryName, scenario.cleanupReason || "Limpieza pre-test");
      
      await context.close();
    });

    test("navigates to close orders screen and closes an order, creating one first if none exist", async ({ page, browser }) => {
      test.setTimeout(180_000);

      const tenantBaseUrl = getTenantBaseUrl();

      await test.step("Navigate to restaurant POS", async () => {
        await navigateToRestaurantPOS(page, tenantBaseUrl, scenario.subsidiaryName);
      });

      await test.step("Open More Options menu and navigate to Close Orders", async () => {
        await navigateToCloseOrderFromOptions(page);
      });

      const emptyMessage = page.getByText(/No hay órdenes disponibles/i);
      const orderCard = page.locator(".tw-border-2.tw-border-gray\\/20.tw-rounded-xl").first();

      await expect(emptyMessage.or(orderCard)).toBeVisible();

      const hasNoOrders = await emptyMessage.isVisible();

      if (hasNoOrders) {
        await test.step("No orders found - create one from Chef", async () => {
          const chefAuthType = scenario.chefAuthType;
          const chefContext = await browser.newContext({ storageState: getChefSessionPath(chefAuthType) });
          const chefPage = await chefContext.newPage();
          
          await createChefOrder(chefPage, { productName: scenario.productName, chefLogin: scenario.chefLogin, chefSubsidiary: scenario.chefSubsidiary, chefAuthType: scenario.chefAuthType });
          
          await chefContext.close();
        });

        await test.step("Return to Close Orders screen", async () => {
          await navigateToRestaurantPOS(page, tenantBaseUrl, scenario.subsidiaryName);
          await navigateToCloseOrderFromOptions(page);
        });
      }

      await test.step("Select the first available order", async () => {
        await expect(orderCard).toBeVisible();
        await orderCard.click();
      });

      await test.step("Process order closure with observations", async () => {
        await processOrderClosure(page, "Cierre de prueba automatizada");
      });
    });
  });
}
