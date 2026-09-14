import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createColor, deleteColor, searchColor } from "./harness/color-helpers.js";

import scenarios from "./0-json-data/basic-color-flow.json" assert { type: "json" };

test.describe("Inventory - Colors (Basic Flow)", () => {
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

      test(`ensures full basic lifecycle for color '${scenario.colorData.name}'`, async ({ page }) => {
        test.setTimeout(120_000); // Dar suficiente tiempo para el flujo completo
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          // ensureAuthenticated se encarga de inyectar la URL base del tenant correcto y verificar el token
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/colors/list", authType: scenario.authType });
          
          // deleteColor es inteligente: si el color no existe, simplemente retorna sin fallar.
          await deleteColor(page, { name: scenario.colorData.name, tenantBaseUrl });
        });

        await test.step('Paso 2: Creación del Color', async () => {
          await createColor(page, {
            ...scenario.colorData,
            tenantBaseUrl
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchColor(page, {
            name: scenario.colorData.name,
            tenantBaseUrl
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Color)', async () => {
          await deleteColor(page, {
            name: scenario.colorData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
