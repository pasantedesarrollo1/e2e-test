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
  fs.readFileSync(path.join(__dirname, "0-json-data", "remove-products-flow.json"), "utf-8")
);

import {
  closeAllActiveOrders,
  createChefOrder,
  finalizeSaleWithPayment,
  navigateToRestaurantPOS,
  openAndSelectOrder,
} from "./harness/pos-orders-common.js";
import {
  confirmProductRemoval,
  navigateToRemoveProducts,
  selectProductToRemove,
} from "./harness/pos-remove-products.js";

async function withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, orderOptions, posOptions, actionCallback) {
  await closeAllActiveOrders(page, tenantBaseUrl, posOptions.subsidiaryName, posOptions.cleanupReason || "Limpieza pre-test");
  
  const chefAuthType = orderOptions.chefAuthType;
  const chefContext = await browser.newContext({ storageState: getChefSessionPath(chefAuthType) });
  const chefPage = await chefContext.newPage();
  const activeTableName = await createChefOrder(chefPage, orderOptions);
  await chefContext.close();

  await navigateToRestaurantPOS(page, tenantBaseUrl, posOptions.subsidiaryName);
  await openAndSelectOrder(page, activeTableName);
  await actionCallback(page, activeTableName);
}

for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Remove Products Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType), openingAmount: scenario.openingAmount, authType: scenario.authType, loginMode: scenario.loginMode});

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("removes a product from an existing order and completes the sale", async ({ page, browser }) => {
      test.setTimeout(180_000);
      const tenantBaseUrl = getTenantBaseUrl();

      await withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, { productName: scenario.productName, chefLogin: scenario.chefLogin, chefSubsidiary: scenario.chefSubsidiary, quantity: 2 }, { subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode, cleanupReason: scenario.cleanupReason }, async (page) => {
        await test.step("Navigate to remove products screen", async () => {
          await navigateToRemoveProducts(page);
        });

        await test.step("Select a product to remove", async () => {
          await selectProductToRemove(page, scenario.removeData.productName);
        });

        await test.step("Confirm removal and verify POS is ready", async () => {
          await confirmProductRemoval(page);
          await expect(page.getByText(/Cliente:/i)).toBeVisible();
        });

        await test.step("Assign customer, finish sale and complete payment", async () => {
          await finalizeSaleWithPayment(page, scenario.clientCedula, scenario.paymentMethod);
        });
      });
    });
  });
}
