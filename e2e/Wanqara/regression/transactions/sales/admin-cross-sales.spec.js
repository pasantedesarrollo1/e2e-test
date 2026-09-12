import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { SEED } from "../../../harness/config/seed.js";
import { 
  selectCustomCheckout, 
  submitValidatedAdminTransaction, 
  selectCustomDocumentType,
  searchAndSelectProduct, 
  selectPaymentMethod 
} from "./harness/admin-cross-sale-flow.js";
// Note: selectClientByCedula was moved out of admin-cross-sale-flow directly to client-helpers, we use the exported one.
import { selectClientByCedula } from "../../../harness/helpers/client-helpers.js";
import { switchAdminSubsidiary } from "./harness/admin-document-helpers.js";

import scenarios from "./0-json-data/admin-cross-sales.json" assert { type: "json" };

test.describe("Admin Sales - Anti-Cross Validation", () => {
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
        scenario.only ? "Dynamically switches branches and validates checkouts (focus)" : "Dynamically switches branches and validates checkouts",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(300_000); 
          const tenantBaseUrl = getTenantBaseUrl();
          
          await test.step("Navigate to admin home", async () => {
            await page.goto(`${tenantBaseUrl}/admin/home`);
            await page.waitForURL(/\/admin\/home/);
          });

          for (const sucursal of scenario.sucursales) {
            await test.step(`Switching UI context to branch: ${sucursal.name}`, async () => {
              await switchAdminSubsidiary(page, sucursal.name);
            });

            for (const combo of sucursal.combinations) {
              await test.step(`Administrative Transaction in: ${combo.bodega} / ${combo.caja}`, async () => {
                await page.goto(`${tenantBaseUrl}${scenario.transaction.path}`);
                await page.waitForURL(new RegExp(scenario.transaction.path.replace(/\//g, '\\/')));

                await selectCustomCheckout(page, combo.bodega, combo.caja);
                await selectCustomDocumentType(page, "Recibos");
                await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);
                await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
                await selectPaymentMethod(page, SEED.paymentMethods.efectivo.label);

                await submitValidatedAdminTransaction(page, scenario.transaction.endpoint);
              });
            }
          }
        }
      );
    });
  }
});