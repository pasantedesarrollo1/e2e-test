import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { createPerson, deactivatePerson, ensureCleanPerson, searchPerson, verifyDeactivatedStrikethrough } from "./harness/people-helpers.js";

import scenarios from "./0-json-data/basic-people-flow.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";

test.describe("People Management (Basic Flow)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {


      test("flujo completo: crear, buscar, desactivar y verificar tachado", async ({ page }) => {
        test.setTimeout(120_000);
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/people/list", authType: scenario.authType });
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
