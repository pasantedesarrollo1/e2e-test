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
  fs.readFileSync(path.join(__dirname, "0-json-data", "close-orders-flow.json"), "utf-8")
);

import {
  navigateToCloseOrder,
  processOrderClosure,
} from "./harness/pos-close-order.js";
import {
  closeAllActiveOrders,
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
  test.describe(`POS ${scenario.description} - Close Orders @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("closes an existing order from the POS", async ({ page, browser }) => {
      test.setTimeout(180_000);
      const tenantBaseUrl = getTenantBaseUrl();

      await withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, { productName: scenario.productName, chefLogin: scenario.chefLogin, chefSubsidiary: scenario.chefSubsidiary }, { subsidiaryName: scenario.subsidiaryName, cleanupReason: scenario.cleanupReason }, async (page, activeTableName) => {
        await test.step("Navigate to close order screen", async () => {
          await navigateToCloseOrder(page);
        });

        await test.step("Process order closure with observations", async () => {
          await processOrderClosure(page, "Cierre de prueba automatizada");
        });
      });
    });
  });
}
