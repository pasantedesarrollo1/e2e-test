import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createSurcharge, deleteSurcharge, searchSurcharge } from "./harness/surcharge-helpers.js";

import scenarios from "./0-json-data/basic-surcharge-flow.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Surcharges (Basic Flow)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test(`ensures full basic lifecycle for surcharge '${scenario.surchargeData.name}'`, async ({ page }) => {
        test.setTimeout(120_000);
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/surcharges/list", authType: scenario.authType });
          await deleteSurcharge(page, { name: scenario.surchargeData.name });
        });

        await test.step('Paso 2: Creación del Recargo', async () => {
          await createSurcharge(page, {
            ...scenario.surchargeData
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchSurcharge(page, {
            name: scenario.surchargeData.name
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Recargo)', async () => {
          await deleteSurcharge(page, {
            name: scenario.surchargeData.name
          });
        });
      });
    });
  
});
