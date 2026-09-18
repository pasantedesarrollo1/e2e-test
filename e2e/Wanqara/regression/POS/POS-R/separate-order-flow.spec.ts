import { expect, test } from "@/e2e/Wanqara/harness/fixtures/stage.fixture.js";
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
  loginMode: "fresh" | "cached" | "";
  subsidiaryName: string;
  subsidiaryCode: string;
  chefAuthType?: string;
  chefLogin?: Record<string, unknown>;
  chefSubsidiary?: string;
  chefSubsidiaryCode?: string;
  productName: string;
  separateData: {
    productName: string;
  };
  clientCedula: string;
  paymentMethod: string;
  metadata?: {
    testScope?: string;
    ws?: string;
    [key: string]: unknown;
  };
}

const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "separate-order-flow.json"), "utf-8")
) as ScenarioData[];

import {
  finalizeSaleWithPayment,
} from "@/e2e/Wanqara/regression/POS/POS-R/harness/pos-orders-common.js";
import {
  confirmOrderSeparation,
  navigateToSeparateOrder,
  selectProductToSeparate,
} from "@/e2e/Wanqara/regression/POS/POS-R/harness/pos-separate-order.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Separate Order Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    
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
      stageSetupOptions: {
        createOrder: {
          productName: scenario.productName
        }
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("separates a product from an existing order and completes the sale", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);
      
      await test.step("Navigate to separate order screen", async () => {
        await navigateToSeparateOrder(page);
      });

      await test.step("Select a product to separate", async () => {
        await selectProductToSeparate(page, scenario.separateData.productName);
      });

      await test.step("Confirm separation and verify POS is ready", async () => {
        await confirmOrderSeparation(page);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();
      });

      await test.step("Assign customer, finish sale and complete payment", async () => {
        await finalizeSaleWithPayment(page, scenario.clientCedula, scenario.paymentMethod);
      });
    });
  });
}
