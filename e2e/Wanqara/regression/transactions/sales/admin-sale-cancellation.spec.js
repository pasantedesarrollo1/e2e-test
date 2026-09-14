import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTenantBaseUrl, requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { searchAndSelectProduct, selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";
import { cancelFirstSaleAndVerify } from "./harness/cancel-sale-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "admin-sale-cancellation.json"), "utf-8")
);

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Normal Sales (Admin)", () => {
  for (const scenario of scenarios) {
    if (scenario.skip) continue;

    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      test("Creates a normal sale and cancels it", async ({ page }) => {
        test.setTimeout(180_000);

        await test.step("Create Normal Sale", async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/ventas/add", authType: scenario.authType });
              await page.waitForURL(/\/admin\/ventas\/add/);
              await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
              await selectDocumentType(page, scenario.saleParams.documentType);
              await selectClientByCedula(page, scenario.saleParams.clientCedula);
              await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
              await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
              await submitAdminSale(page);
        });

        await test.step("Cancel Sale and Verify Modal", async () => {
          await cancelFirstSaleAndVerify(page, {
            tenantBaseUrl,
            expectSwitch: scenario.cancellationParams.expectSwitch,
            expectMessage: scenario.cancellationParams.expectMessage,
          });
        });
      });
    });
  }
});
