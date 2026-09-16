import { expect, test } from "../../../harness/builders/stage.builder.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "collect-orders-flow.json"), "utf-8")
);

import {
  finalizeSaleWithPayment,
} from "./harness/pos-orders-common.js";

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
        createOrder: true,
        productName: scenario.productName
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("collects an existing order, assigns a client and completes the sale", async ({ posPage: page }) => {
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
