import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createSize, deleteSize, searchSize } from "./harness/size-helpers.js";

import scenarios from "./0-json-data/basic-size-flow.json" assert { type: "json" };

test.describe("Inventory - Sizes (Basic Flow)", () => {
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

      test(`ensures full basic lifecycle for size '${scenario.sizeData.name}'`, async ({ page }) => {
        test.setTimeout(120_000);
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/sizes/list", authType: scenario.authType });
          await deleteSize(page, { name: scenario.sizeData.name, tenantBaseUrl });
        });

        await test.step('Paso 2: Creación de la Talla', async () => {
          await createSize(page, {
            ...scenario.sizeData,
            tenantBaseUrl
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchSize(page, {
            name: scenario.sizeData.name,
            tenantBaseUrl
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Talla)', async () => {
          await deleteSize(page, {
            name: scenario.sizeData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
