/* eslint-disable */
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { createPerson, deactivatePerson, ensureCleanPerson, searchPerson, verifyDeactivatedStrikethrough } from "./harness/people-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

// @ts-ignore
import type { PersonData } from './harness/people-helpers.js';
interface ScenarioData extends ScenarioDefinition, TestMetadata {
  subsidiaryName: string;
  subsidiaryCode: string;
  authType: string;
  loginMode: "fresh" | "cached" | "";
  personData: PersonData;
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "basic-people-flow.json"), "utf-8")
);

test.describe("People Management (Basic Flow)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    
    test.use({ 
      targetPath: "/admin/people/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode as any
    });

    test("flujo completo: crear, buscar, desactivar y verificar tachado", async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(120_000);
      
      await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
        await ensureCleanPerson(page, { identity: scenario.personData.identity });
      });

      await test.step('Paso 2: Crear Persona', async () => {
        await createPerson(page, { ...scenario.personData });
      });

      await test.step('Paso 3: Buscar Persona', async () => {
        await searchPerson(page, { identity: scenario.personData.identity });
      });

      await test.step('Paso 4: Desactivar Persona', async () => {
        await deactivatePerson(page, { identity: scenario.personData.identity });
      });

      await test.step('Paso 5: Verificar que la persona aparece tachada (line-through)', async () => {
        await verifyDeactivatedStrikethrough(page, { identity: scenario.personData.identity });
      });
    });
  });
  
});
