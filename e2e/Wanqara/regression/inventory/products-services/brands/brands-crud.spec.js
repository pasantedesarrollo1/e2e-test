import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { createBrand, searchBrand, deleteBrand } from "./harness/brand-helpers.js";

import scenarios from "./0-json-data/brands-crud.json" assert { type: "json" };

test.describe("Inventory - Brands (CRUD)", () => {
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

      test(`ensures full CRUD lifecycle for brand '${scenario.brandData.name}'`, async ({ page }) => {
        // En este Spec, ensamblamos TODOS los Legos manualmente para contar la historia
        
        await test.step('Paso 1: Crear la marca', async () => {
          await createBrand(page, {
            ...scenario.brandData,
            tenantBaseUrl
          });
        });

        await test.step('Paso 2: Buscar y verificar', async () => {
          await searchBrand(page, {
            name: scenario.brandData.name,
            tenantBaseUrl
          });
        });

        await test.step('Paso 3: Eliminar registro', async () => {
          await deleteBrand(page, {
            name: scenario.brandData.name,
            tenantBaseUrl
          });
        });
        
      });
    });
  }
});
