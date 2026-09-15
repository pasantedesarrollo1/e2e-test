import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createDiscount, deleteDiscount, searchDiscount } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/basic-discount-flow.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Discounts (Basic Flow)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test(`ensures full basic lifecycle for discount '${scenario.discountData.name}'`, async ({ page }) => {
        test.setTimeout(120_000);
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/discounts/list", authType: scenario.authType });
          await deleteDiscount(page, { name: scenario.discountData.name });
        });

        await test.step('Paso 2: Creación del Descuento', async () => {
          await createDiscount(page, {
            ...scenario.discountData
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchDiscount(page, {
            name: scenario.discountData.name
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Descuento)', async () => {
          await deleteDiscount(page, {
            name: scenario.discountData.name
          });
        });
      });
    });
  
});
