import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { searchAndSelectProduct, selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";
import { cancelFirstSaleAndVerify } from "./harness/cancel-sale-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "admin-sale-cancellation.json"), "utf-8")
);

import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";


test.describe.serial("Cancel Normal Sales (Admin)", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test("Creates a normal sale and cancels it", async ({ page }) => {
      test.setTimeout(180_000);

      await test.step("Create Normal Sale", async () => {
        await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
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
          expectSwitch: scenario.cancellationParams.expectSwitch,
          expectMessage: scenario.cancellationParams.expectMessage});
      });
    });
  });
});
