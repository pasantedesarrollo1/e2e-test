/* eslint-disable */
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/stage.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "@/e2e/Wanqara/harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "close-orders-from-options.json"), "utf-8")
);

import { processOrderClosure } from "./harness/pos-close-order.js";
import {
  createChefOrder,
  navigateToCloseOrderFromOptions,
} from "./harness/pos-orders-common.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Close Orders from Options Menu @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode,
      chefAuthType: scenario.chefAuthType,
      chefLogin: scenario.chefLogin,
      chefSubsidiary: scenario.chefSubsidiary,
      chefSubsidiaryCode: scenario.chefSubsidiaryCode
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("navigates to close orders screen and closes an order", async ({ stageEnvironment, chefContext  }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);

      await test.step("Create order in Chef manually", async () => {
        await createChefOrder(chefContext!, {
          productName: scenario.productName,
          chefLogin: scenario.chefLogin,
          chefSubsidiary: scenario.chefSubsidiary,
          chefSubsidiaryCode: scenario.chefSubsidiaryCode
        });
      });

      await test.step("Open More Options menu and navigate to Close Orders", async () => {
        await navigateToCloseOrderFromOptions(page);
      });

      const orderCard = page.locator(".tw-border-2.tw-border-gray\\/20.tw-rounded-xl").first();

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
