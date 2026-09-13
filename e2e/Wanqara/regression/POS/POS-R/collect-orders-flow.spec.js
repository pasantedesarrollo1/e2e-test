import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getTenantBaseUrl,
  requireChefCredentials,
  requirePosCredentials,
} from "../../../harness/config/settings.js";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "collect-orders-flow.json"), "utf-8")
);

import {
  closeAllActiveOrders,
  createChefOrder,
  finalizeSaleWithPayment,
  navigateToRestaurantPOS,
  openAndSelectOrder,
} from "./harness/pos-orders-common.js";

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
  test.describe(`POS ${scenario.description} - Collect Orders @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("collects an existing order, assigns a client and completes the sale", async ({ page, browser }) => {
      test.setTimeout(180_000);
      const tenantBaseUrl = getTenantBaseUrl();

      await withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, async (page, activeTableName) => {
        await test.step("Load order into POS via Procesar pago", async () => {
          const cobrarBtn = page
            .getByRole("button", { name: /Cobrar/i })
            .filter({ hasText: /Procesar pago/i })
            .first();
          await expect(cobrarBtn).toBeVisible();
          await cobrarBtn.click();
          await expect(page.getByText(/Cliente:/i)).toBeVisible();
        });

        await test.step("Assign customer, finish sale and complete payment", async () => {
          await finalizeSaleWithPayment(page);
        });
      });
    });
  });
}
