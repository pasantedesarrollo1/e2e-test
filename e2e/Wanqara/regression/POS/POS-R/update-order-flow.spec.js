import { expect, test } from "../../../harness/builders/stage.builder.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "update-order-flow.json"), "utf-8")
);

import { completePayment } from "../harness/payments/pos-payment.js";
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
        createOrder: true,
        productName: scenario.productName
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("adds a product to an existing order and completes the sale", async ({ posPage: page }) => {
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
