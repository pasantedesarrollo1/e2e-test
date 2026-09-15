import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { SessionContextBuilder } from "../../../../harness/helpers/builders/session-context-builder.js";
import { createColor, deleteColor, searchColor } from "./harness/color-helpers.js";

import scenarios from "./0-json-data/basic-color-flow.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Inventory - Colors (Basic Flow)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {

      test(`ensures full basic lifecycle for color '${scenario.colorData.name}'`, async ({ page }) => {
        test.setTimeout(120_000); // Dar suficiente tiempo para el flujo completo
        
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          // El Builder decide si usa caché o hace login nuevo, y nos deja en la sucursal correcta
          await SessionContextBuilder.build(page, scenario, { targetPath: "/admin/colors/list" });
          
          // deleteColor es inteligente: si el color no existe, simplemente retorna sin fallar.
          await deleteColor(page, { name: scenario.colorData.name });
        });

        await test.step('Paso 2: Creación del Color', async () => {
          await createColor(page, {
            ...scenario.colorData
          });
        });

        await test.step('Paso 3: Búsqueda y Validación', async () => {
          await searchColor(page, {
            name: scenario.colorData.name
          });
        });

        await test.step('Paso 4: Limpieza post-prueba (Eliminar Color)', async () => {
          await deleteColor(page, {
            name: scenario.colorData.name
          });
        });
      });
    });
  
});
