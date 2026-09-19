/* eslint-disable */
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { test } from "@/e2e/Wanqara/harness/fixtures/restaurant.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "@/e2e/Wanqara/harness/helpers/reporting/annotate.js";
import {
  navigateToCloseOrder,
  processOrderClosure,
} from "@/e2e/Wanqara/regression/POS/POS-R/harness/pos-close-order.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
interface ScenarioData {
  description: string;
  openingAmount: string;
  authType: string;
  loginMode: "fresh" | "cached" | "";
  subsidiaryName: string;
  subsidiaryCode: string;
  chefAuthType?: string;
  chefLogin?: Record<string, unknown>;
  chefSubsidiary?: string;
  chefSubsidiaryCode?: string;
  productName: string;
  metadata?: {
    testScope?: string;
    ws?: string;
    [key: string]: unknown;
  };
}

const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "close-orders-flow.json"), "utf-8")
));

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Close Orders Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode,
      chefAuthType: scenario.chefAuthType,
      chefLogin: scenario.chefLogin,
      chefSubsidiary: scenario.chefSubsidiary,
      chefSubsidiaryCode: scenario.chefSubsidiaryCode,
      restaurantSetupOptions: {
        createOrder: {
          productName: scenario.productName
        }
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("closes an existing order from the POS", async ({ restaurantEnvironment }) => {
      const { page } = restaurantEnvironment;
      test.setTimeout(180_000);
      
      await test.step("Navigate to close order screen", async () => {
        await navigateToCloseOrder(page);
      });

      await test.step("Process order closure with observations", async () => {
        await processOrderClosure(page, "Cierre de prueba automatizada");
      });
    });
  });
}
