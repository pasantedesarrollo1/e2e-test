import { test } from "../../../../harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { createColor, deleteColor, searchColor } from "./harness/color-helpers.js";
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "basic-color-flow.json"), "utf-8")
);

test.describe("Inventory - Colors (Basic Flow)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {

    test.use({ 
      targetPath: "/admin/colors/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test(`ensures full basic lifecycle for color '${scenario.colorData.name}'`, async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(120_000); 
      
      await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
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
