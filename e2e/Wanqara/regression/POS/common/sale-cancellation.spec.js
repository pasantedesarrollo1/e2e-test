import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { cancelFirstSaleAndVerify } from "../../transactions/sales/harness/cancel-sale-flow.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from '../harness/sales/pos-checkout-helpers.js';
import { test } from "../../../harness/builders/pos.builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cancellation.json"), "utf-8")
);

test.describe("Cancel Sales (POS)", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    test(scenario.description, async ({ posPage: page }) => {
      test.setTimeout(180_000);

      await test.step("Create POS Sale", async () => {
        await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
        await selectClientByCedula(page, scenario.saleParams.clientCedula);
        await clickFinishSale(page);
        await completePayment(page, { paymentMethod: scenario.saleParams.paymentMethod });
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
