import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { createDiscount, searchDiscount } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/discounts-search.json" assert { type: "json" };

test.describe("Inventory - Discounts (Search)", () => {
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

      test(`ensures discount '${scenario.discountData.name}' can be found via search`, async ({ page }) => {
        await test.step('Precondición: Crear el descuento por UI', async () => {
          await createDiscount(page, {
            ...scenario.discountData,
            tenantBaseUrl
          });
        });
        await test.step('Acción: Buscar el descuento', async () => {
          await searchDiscount(page, {
            name: scenario.discountData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
