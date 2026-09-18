/* eslint-disable */
import { test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { selectCheckout, selectPaymentMethod, searchAndSelectProduct, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { switchAdminSubsidiary } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";

import scenariosRaw from "./0-json-data/admin-cross-sales.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface TransactionParams {
  path: string;
  clientCedula: string;
  productName: string;
  paymentMethod: string;
  endpoint: string;
}

interface ScenarioData extends ScenarioDefinition, TestMetadata {
  sucursales: { name: string; code: string; combinations: any[] }[];
  transaction: TransactionParams;
  subsidiaryName: string;
  subsidiaryCode: string;
}


test.describe("Admin Sales - Anti-Cross Validation", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
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

              await selectCheckout(page, { 
                warehouseName: combo.bodega,
                urlPattern: new RegExp(scenario.transaction.path.replace(/\//g, '\\/'))
              });
              await selectDocumentType(page, "Recibos");
              await selectClientByCedula(page, scenario.transaction.clientCedula);
              await searchAndSelectProduct(page, { name: scenario.transaction.productName });
              await selectPaymentMethod(page, scenario.transaction.paymentMethod);

              await submitAdminSale(page, scenario.transaction.endpoint);
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
