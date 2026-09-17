import { expect, test } from "../../../harness/fixtures/stage.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "remove-products-flow.json"), "utf-8")
);

import {
  finalizeSaleWithPayment,
} from "./harness/pos-orders-common.js";
import {
  confirmProductRemoval,
  navigateToRemoveProducts,
  selectProductToRemove,
} from "./harness/pos-remove-products.js";

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Remove Products Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    
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
        productName: scenario.productName,
        quantity: 2
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("removes a product from an existing order and completes the sale", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);
      
      await test.step("Navigate to remove products screen", async () => {
        await navigateToRemoveProducts(page);
      });

      await test.step("Select a product to remove", async () => {
        await selectProductToRemove(page, scenario.removeData.productName);
      });

      await test.step("Confirm removal and verify POS is ready", async () => {
        await confirmProductRemoval(page);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();
      });

      await test.step("Assign customer, finish sale and complete payment", async () => {
        await finalizeSaleWithPayment(page, scenario.clientCedula, scenario.paymentMethod);
      });
    });
  });
}
