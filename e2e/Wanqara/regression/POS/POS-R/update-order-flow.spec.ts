import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
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
  loginMode: 'fresh' | 'cached' | '';
  subsidiaryName: string;
  subsidiaryCode: string;
  chefAuthType?: string;
  chefLogin?: Record<string, unknown>;
  chefSubsidiary?: string;
  chefSubsidiaryCode?: string;
  productName: string;
  updateData: { productName: string };
  paymentMethod: string;
  metadata?: { testScope?: string; ws?: string; [key: string]: unknown };
}

const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "update-order-flow.json"), "utf-8"))
);

import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import {
  addProductToExistingOrder,
  collectOrder,
} from "./harness/pos-orders-common.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Update Order Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    
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
        createOrder: { productName: scenario.productName },
        
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("adds a product to an existing order and completes the sale", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);

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
    });
  });
}
