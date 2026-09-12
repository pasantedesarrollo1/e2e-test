import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { createDiscount, searchDiscount, deleteDiscount } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/discounts-crud.json" assert { type: "json" };

test.describe("Inventory - Discounts (CRUD)", () => {
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

      test(`ensures full CRUD lifecycle for discount '${scenario.discountData.name}'`, async ({ page }) => {
        await test.step('Paso 1: Crear el descuento', async () => {
          await createDiscount(page, {
            ...scenario.discountData,
            tenantBaseUrl
          });
        });
        await test.step('Paso 2: Buscar y verificar', async () => {
          await searchDiscount(page, {
            name: scenario.discountData.name,
            tenantBaseUrl
          });
        });
        await test.step('Paso 3: Eliminar registro', async () => {
          await deleteDiscount(page, {
            name: scenario.discountData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
