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
  fs.readFileSync(path.join(__dirname, "0-json-data", "update-order-flow.json"), "utf-8")
);

import { completePayment } from "../harness/payments/pos-payment.js";
import {
  addProductToExistingOrder,
  closeAllActiveOrders,
  collectOrder,
  createChefOrder,
  navigateToRestaurantPOS,
  openAndSelectOrder,
} from "./harness/pos-orders-common.js";

async function withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, orderOptions, posOptions, actionCallback) {
  await closeAllActiveOrders(page, tenantBaseUrl, posOptions.subsidiaryName, posOptions.cleanupReason || "Limpieza pre-test");
  
  const chefContext = await browser.newContext({ storageState: getSessionPath("chef") });
  const chefPage = await chefContext.newPage();
  const activeTableName = await createChefOrder(chefPage, orderOptions);
  await chefContext.close();

  await navigateToRestaurantPOS(page, tenantBaseUrl, posOptions.subsidiaryName);
  await openAndSelectOrder(page, activeTableName);
  await actionCallback(page, activeTableName);
}

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Update Order Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType), openingAmount: scenario.openingAmount });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("adds a product to an existing order and completes the sale", async ({ page, browser }) => {
      test.setTimeout(180_000);
      const tenantBaseUrl = getTenantBaseUrl();

      await withActiveRestaurantOrderSafe(
        browser, 
        page, 
        tenantBaseUrl, 
        { productName: scenario.productName, chefLogin: scenario.chefLogin, chefSubsidiary: scenario.chefSubsidiary }, { subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode, cleanupReason: scenario.cleanupReason }, async (page) => {
          await test.step("Add a product to the existing order", async () => {
            await addProductToExistingOrder(page, scenario.updateData.productName);
          });

          await test.step("Collect order and verify payments screen", async () => {
            await collectOrder(page);
            await page.waitForURL(/\/pos\/restaurant-payments/);
            await expect(page.getByText(/Cliente:/i)).toBeVisible();
          });

          await test.step("Complete the payment process", async () => {
            await completePayment(page, { paymentMethod: scenario.paymentMethod });
          });
        },
        {}, 
        scenario.posOptions
      );
    });
  });
}
