import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { createDiscount, deleteDiscount } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/discounts-delete.json" assert { type: "json" };

test.describe("Inventory - Discounts (Delete)", () => {
  requirePosCredentials(test);
  const tenantBaseUrl = getTenantBaseUrl();

  for (const scenario of scenarios) {
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuración en JSON';
        test(`Omitido: ${razon}`, async () => {});
      });
      continue;
    }

    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const executionTag = `@${scope}`;
    const describeBlock = scenario.only ? test.describe.only : test.describe;

    describeBlock(`Escenario: ${scenario.description} ${executionTag}`, () => {
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(`ensures discount '${scenario.discountData.name}' can be deleted`, async ({ page }) => {
        await test.step('Precondición: Crear el descuento por UI', async () => {
          await createDiscount(page, {
            ...scenario.discountData,
            tenantBaseUrl
          });
        });
        await test.step('Acción: Eliminar el descuento', async () => {
          await deleteDiscount(page, {
            name: scenario.discountData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
