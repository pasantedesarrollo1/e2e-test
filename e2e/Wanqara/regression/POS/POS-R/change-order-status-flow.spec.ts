import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { test } from "@/e2e/Wanqara/harness/fixtures/restaurant.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "@/e2e/Wanqara/harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScenarioData {
  description: string;
  openingAmount: string;
  authType: string;
  loginMode: 'fresh' | 'cached' | '';
  subsidiaryName: string;
  subsidiaryCode: string;
  chefAuthType?: string;
  chefLogin?: Record<string, unknown>;
  chefSubsidiary?: string;
  chefSubsidiaryCode?: string;
  productName: string;
  metadata?: { testScope?: string; ws?: string; [key: string]: unknown };
}

const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "change-order-status-flow.json"), "utf-8"))
);

import {
  printPreticket
} from "./harness/chef-orders-flow.js";
import {
  processOrderStatusChange,
  selectOrderToChangeStatus,
} from "./harness/pos-change-order-status.js";
import {
  createChefOrder,
  navigateToChangeOrderStatusFromOptions,
} from "./harness/pos-orders-common.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Change Order Status Flow @${scenario.metadata?.testScope || 'regression'}`, () => {

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

    // Assertions are encapsulated in Page Object helpers.
    // eslint-disable-next-line playwright/expect-expect
    test("creates an order in Chef, prints preticket, and changes status back to pending in POS", async ({ restaurantEnvironment, chefContext  }) => {
      const { page } = restaurantEnvironment;
      test.setTimeout(180_000);

      await test.step("Create order and print preticket from Chef", async () => {
        await createChefOrder(chefContext!, { 
            productName: scenario.productName, 
            chefLogin: scenario.chefLogin, 
            chefSubsidiary: scenario.chefSubsidiary, 
            chefSubsidiaryCode: scenario.chefSubsidiaryCode 
        });
        await printPreticket(chefContext!);
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
