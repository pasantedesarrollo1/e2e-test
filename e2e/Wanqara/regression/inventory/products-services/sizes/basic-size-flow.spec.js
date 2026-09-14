import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createSize, deleteSize, searchSize } from "./harness/size-helpers.js";

import scenarios from "./0-json-data/basic-size-flow.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Sizes (Basic Flow)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test(`ensures full basic lifecycle for size '${scenario.sizeData.name}'`, async ({ page }) => {
        test.setTimeout(120_000);
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/sizes/list", authType: scenario.authType });
          await deleteSize(page, { name: scenario.sizeData.name });
        });

        await test.step('Paso 2: Creación de la Talla', async () => {
          await createSize(page, {
            ...scenario.sizeData
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchSize(page, {
            name: scenario.sizeData.name
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Talla)', async () => {
          await deleteSize(page, {
            name: scenario.sizeData.name
          });
        });
      });
    });
  
});
