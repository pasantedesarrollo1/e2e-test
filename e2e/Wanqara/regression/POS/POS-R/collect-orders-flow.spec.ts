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
  clientCedula: string;
  paymentMethod: string;
  metadata?: {
    testScope?: string;
    ws?: string;
    [key: string]: unknown;
  };
}

const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "collect-orders-flow.json"), "utf-8")
) as ScenarioData[];

import {
  finalizeSaleWithPayment,
} from "@/e2e/Wanqara/regression/POS/POS-R/harness/pos-orders-common.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Collect Orders Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    
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

    test("collects an existing order, assigns a client and completes the sale", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);
      
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
        await finalizeSaleWithPayment(page, scenario.clientCedula, scenario.paymentMethod);
      });
    });
  });
}
