import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createSurcharge, deleteSurcharge, searchSurcharge } from "./harness/surcharge-helpers.js";

import scenarios from "./0-json-data/basic-surcharge-flow.json" assert { type: "json" };

test.describe("Inventory - Surcharges (Basic Flow)", () => {
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

      test(`ensures full basic lifecycle for surcharge '${scenario.surchargeData.name}'`, async ({ page }) => {
        test.setTimeout(120_000);
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/surcharges/list", authType: scenario.authType });
          await deleteSurcharge(page, { name: scenario.surchargeData.name, tenantBaseUrl });
        });

        await test.step('Paso 2: Creación del Recargo', async () => {
          await createSurcharge(page, {
            ...scenario.surchargeData,
            tenantBaseUrl
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchSurcharge(page, {
            name: scenario.surchargeData.name,
            tenantBaseUrl
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Recargo)', async () => {
          await deleteSurcharge(page, {
            name: scenario.surchargeData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
