import { test } from "../../../harness/fixtures/stage.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "close-orders-flow.json"), "utf-8")
);

import {
  navigateToCloseOrder,
  processOrderClosure,
} from "./harness/pos-close-order.js";

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
      stageSetupOptions: {
        createOrder: true,
        productName: scenario.productName
      }
    });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test("closes an existing order from the POS", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
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
