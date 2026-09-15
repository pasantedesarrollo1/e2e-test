import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import {
  searchAndSelectProduct,
  selectCustomCheckout,
  selectCustomDocumentType,
  selectPaymentMethod,
  submitValidatedAdminTransaction
} from "./harness/admin-cross-sale-flow.js";
// Note: selectClientByCedula was moved out of admin-cross-sale-flow directly to client-helpers, we use the exported one.
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { switchAdminSubsidiary } from "../../../harness/helpers/auth/auth.js";

import scenarios from "./0-json-data/admin-cross-sales.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";

test.describe("Admin Sales - Anti-Cross Validation", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Dynamically switches branches and validates checkouts (focus)" : "Dynamically switches branches and validates checkouts",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(300_000); 
        
        await test.step("Navigate to admin home", async () => {
          await page.goto('/admin/home');
          await page.waitForURL(/\/admin\/home/);
        });

        for (const sucursal of scenario.sucursales) {
          await test.step(`Switching UI context to branch: ${sucursal.name}`, async () => {
            await switchAdminSubsidiary(page, sucursal.name, sucursal.code);
          });

          for (const combo of sucursal.combinations) {
            await test.step(`Administrative Transaction in: ${combo.bodega} / ${combo.caja}`, async () => {
              await page.goto(scenario.transaction.path);
              await page.waitForURL(new RegExp(scenario.transaction.path.replace(/\//g, '\\/')));

              await selectCustomCheckout(page, combo.bodega, combo.caja);
              await selectCustomDocumentType(page, "Recibos");
              await selectClientByCedula(page, scenario.transaction.clientCedula);
              await searchAndSelectProduct(page, { name: scenario.transaction.productName });
              await selectPaymentMethod(page, scenario.transaction.paymentMethod);

              await submitValidatedAdminTransaction(page, scenario.transaction.endpoint);
            });
          }
        }

        await test.step(`Teardown: Restore original UI context to branch: ${scenario.subsidiaryName}`, async () => {
          await switchAdminSubsidiary(page, scenario.subsidiaryName, scenario.subsidiaryCode);
        });
      }
    );
  });
});
