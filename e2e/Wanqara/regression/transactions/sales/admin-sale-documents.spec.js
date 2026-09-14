import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { searchAndSelectProduct, selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";

import scenarios from "./0-json-data/admin-sale-documents.json" assert { type: "json" };

test.describe("Admin Sales - Documents", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(
        scenario.only ? "Completes an admin sale with document type (focus)" : "Completes an admin sale with document type",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Create Admin Sale", async () => {
            await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/ventas/add", authType: scenario.authType });
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
  }
});