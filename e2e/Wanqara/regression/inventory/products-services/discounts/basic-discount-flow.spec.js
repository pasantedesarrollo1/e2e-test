import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createDiscount, deleteDiscount, searchDiscount } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/basic-discount-flow.json" assert { type: "json" };

test.describe("Inventory - Discounts (Basic Flow)", () => {
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

      test(`ensures full basic lifecycle for discount '${scenario.discountData.name}'`, async ({ page }) => {
        test.setTimeout(120_000);
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/discounts/list", authType: scenario.authType });
          await deleteDiscount(page, { name: scenario.discountData.name, tenantBaseUrl });
        });

        await test.step('Paso 2: Creación del Descuento', async () => {
          await createDiscount(page, {
            ...scenario.discountData,
            tenantBaseUrl
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchDiscount(page, {
            name: scenario.discountData.name,
            tenantBaseUrl
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Descuento)', async () => {
          await deleteDiscount(page, {
            name: scenario.discountData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
