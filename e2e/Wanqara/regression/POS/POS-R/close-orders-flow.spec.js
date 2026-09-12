import { test } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "close-orders-flow.json"), "utf-8")
);

import {
  closeAllActiveOrders,
  createChefOrder,
  navigateToRestaurantPOS,
  openAndSelectOrder,
} from "./harness/pos-orders-common.js";
import {
  navigateToCloseOrder,
  processOrderClosure,
} from "./harness/pos-close-order.js";

async function withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, actionCallback, orderOptions = {}) {
  await closeAllActiveOrders(page, tenantBaseUrl);
  
  const chefContext = await browser.newContext({ storageState: getSessionPath("chef") });
  const chefPage = await chefContext.newPage();
  const activeTableName = await createChefOrder(chefPage, orderOptions);
  await chefContext.close();

  await navigateToRestaurantPOS(page, tenantBaseUrl);
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

      await withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, async (page, activeTableName) => {
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
