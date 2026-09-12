import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { createSize, searchSize, deleteSize } from "./harness/size-helpers.js";

import scenarios from "./0-json-data/sizes-crud.json" assert { type: "json" };

test.describe("Inventory - Sizes (CRUD)", () => {
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

      test(`ensures full CRUD lifecycle for size '${scenario.sizeData.name}'`, async ({ page }) => {
        await test.step('Paso 1: Crear la talla', async () => {
          await createSize(page, {
            ...scenario.sizeData,
            tenantBaseUrl
          });
        });
        await test.step('Paso 2: Buscar y verificar', async () => {
          await searchSize(page, {
            name: scenario.sizeData.name,
            tenantBaseUrl
          });
        });
        await test.step('Paso 3: Eliminar registro', async () => {
          await deleteSize(page, {
            name: scenario.sizeData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
