/* eslint-disable */
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { createSurcharge, deleteSurcharge, searchSurcharge , type CreateSurchargeOptions } from "./harness/surcharge-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

interface ScenarioData extends FlatScenario {
  loginMode?: 'fresh' | 'cached';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  authType?: string;
  surchargeData: CreateSurchargeOptions;
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "basic-surcharge-flow.json"), "utf-8"))
);

test.describe("Inventory - Surcharges (Basic Flow)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario) => {

    test.use({ 
      targetPath: "/admin/surcharges/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test(`ensures full basic lifecycle for surcharge '${scenario.surchargeData.name}'`, async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(120_000);
      
      await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
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
