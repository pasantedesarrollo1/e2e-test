/* eslint-disable */
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { createDiscount, deleteDiscount, searchDiscount , type DiscountPayload } from "./harness/discount-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

type ScenarioData = AdminScenario & {
  loginMode?: 'fresh' | 'cached';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  authType?: string;
  discountData: DiscountPayload;
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "basic-discount-flow.json"), "utf-8"))
);

test.describe("Inventory - Discounts (Basic Flow)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario) => {

    test.use({ 
      targetPath: "/admin/discounts/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test(`ensures full basic lifecycle for discount '${scenario.discountData.name}'`, async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(120_000);
      
      await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
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
