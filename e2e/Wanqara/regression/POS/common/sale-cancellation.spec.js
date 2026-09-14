import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTenantBaseUrl, requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { cancelFirstSaleAndVerify } from "../../transactions/sales/harness/cancel-sale-flow.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from '../harness/sales/pos-checkout-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cancellation.json"), "utf-8")
);

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Sales (POS)", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType), openingAmount: scenario.openingAmount });

      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      test(scenario.description, async ({ page }) => {
        test.setTimeout(180_000);

        await test.step("Create POS Sale", async () => {
          await ensureAuthenticated(page, { 
            tenantBaseUrl, 
            targetPath: scenario.targetPath, 
            authType: scenario.authType 
          });
          
          await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
          await selectClientByCedula(page, scenario.saleParams.clientCedula);
          await clickFinishSale(page);
          await completePayment(page, { paymentMethod: scenario.paymentMethod });
        });

        await test.step("Cancel POS Sale and Verify Modal", async () => {
          await cancelFirstSaleAndVerify(page, {
            tenantBaseUrl,
            expectSwitch: scenario.expectSwitch,
            expectMessage: scenario.expectMessage,
          });
        });
      });
    });
  }
});
