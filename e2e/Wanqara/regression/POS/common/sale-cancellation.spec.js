import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { cancelFirstSaleAndVerify } from "../../transactions/sales/harness/cancel-sale-flow.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from '../harness/sales/pos-checkout-helpers.js';
import { test } from "../harness/setup/pos-fixtures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cancellation.json"), "utf-8")
);

test.describe.serial("Cancel Sales (POS)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {
    
    const runTest = (title, bodyFn) => {
      // Determine correct fixture based on targetPath to prevent crossing routes (Restaurant vs Retail)
      if (scenario.targetPath && scenario.targetPath.includes('restaurant-home')) {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      }
    };

    runTest(scenario.description, async (page) => {
      test.setTimeout(180_000);

      await test.step("Create POS Sale", async () => {
        // posPage and posRestaurantPage fixtures already handle ensureCashRegisterOpen and auth
        await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
        await selectClientByCedula(page, scenario.saleParams.clientCedula);
        await clickFinishSale(page);
        await completePayment(page, { paymentMethod: scenario.paymentMethod });
      });

      await test.step("Cancel POS Sale and Verify Modal", async () => {
        await cancelFirstSaleAndVerify(page, {
          expectSwitch: scenario.expectSwitch,
          expectMessage: scenario.expectMessage,
        });
      });
    });
  });
});
