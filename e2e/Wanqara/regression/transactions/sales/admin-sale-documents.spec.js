import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { searchAndSelectProduct, selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";

import scenarios from "./0-json-data/admin-sale-documents.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";

test.describe("Admin Sales - Documents", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes an admin sale with document type (focus)" : "Completes an admin sale with document type",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Create Admin Sale", async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
            await selectDocumentType(page, scenario.saleParams.documentType);
            await selectClientByCedula(page, scenario.saleParams.clientCedula);
            await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
            await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
            await submitAdminSale(page);
        });
      }
    );
  });
});