import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createBrand, deleteBrand, searchBrand } from "./harness/brand-helpers.js";

import scenarios from "./0-json-data/basic-brand-flow.json" assert { type: "json" };

test.describe("Inventory - Brands (Basic Flow)", () => {
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

      test(`ensures full basic lifecycle for brand '${scenario.brandData.name}'`, async ({ page }) => {
        test.setTimeout(120_000); 
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/brands/list", authType: scenario.authType });
          await deleteBrand(page, { name: scenario.brandData.name, tenantBaseUrl });
        });

        await test.step('Paso 2: Creación de la Marca', async () => {
          await createBrand(page, {
            ...scenario.brandData,
            tenantBaseUrl
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchBrand(page, {
            name: scenario.brandData.name,
            tenantBaseUrl
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Marca)', async () => {
          await deleteBrand(page, {
            name: scenario.brandData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
