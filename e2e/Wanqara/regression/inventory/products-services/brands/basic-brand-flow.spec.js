import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createBrand, deleteBrand, searchBrand } from "./harness/brand-helpers.js";

import scenarios from "./0-json-data/basic-brand-flow.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Brands (Basic Flow)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test(`ensures full basic lifecycle for brand '${scenario.brandData.name}'`, async ({ page }) => {
        test.setTimeout(120_000); 
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/brands/list", authType: scenario.authType });
          await deleteBrand(page, { name: scenario.brandData.name });
        });

        await test.step('Paso 2: Creación de la Marca', async () => {
          await createBrand(page, {
            ...scenario.brandData
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchBrand(page, {
            name: scenario.brandData.name
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Marca)', async () => {
          await deleteBrand(page, {
            name: scenario.brandData.name
          });
        });
      });
    });
  
});
