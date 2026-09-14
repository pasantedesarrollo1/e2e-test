import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { createPerson, deactivatePerson, ensureCleanPerson, searchPerson, verifyDeactivatedStrikethrough } from "./harness/people-helpers.js";

import scenarios from "./0-json-data/basic-people-flow.json" assert { type: "json" };

test.describe("People Management (Basic Flow)", () => {
  requirePosCredentials(test);
  const tenantBaseUrl = getTenantBaseUrl();

  for (const scenario of scenarios) {
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuraci\u00f3n en JSON';
        test(`Omitido: ${razon}`, async () => {});
      });
      continue;
    }

    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const executionTag = `@${scope}`;
    const describeBlock = scenario.only ? test.describe.only : test.describe;

    describeBlock(`Escenario: ${scenario.description} ${executionTag}`, () => {
      if (scenario.metadata && scenario.metadata.ws !== undefined) {
        annotateTicket(test, scenario.metadata);
      }
      
      test.use({ storageState: getSessionPath(scenario.authType) });

      test("flujo completo: crear, buscar, desactivar y verificar tachado", async ({ page }) => {
        test.setTimeout(120_000);
        await test.step('Paso 1: Pre-Limpieza (Garantizar entorno limpio)', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/people/list", authType: scenario.authType });
          await ensureCleanPerson(page, { identity: scenario.personData.identity, tenantBaseUrl });
        });

        await test.step('Paso 2: Crear Persona', async () => {
          await createPerson(page, { ...scenario.personData, tenantBaseUrl });
        });

        await test.step('Paso 3: Buscar Persona', async () => {
          await searchPerson(page, { identity: scenario.personData.identity, tenantBaseUrl });
        });

        await test.step('Paso 4: Desactivar Persona', async () => {
          await deactivatePerson(page, { identity: scenario.personData.identity, tenantBaseUrl });
        });

        await test.step('Paso 5: Verificar que la persona aparece tachada (line-through)', async () => {
          await verifyDeactivatedStrikethrough(page, { identity: scenario.personData.identity, tenantBaseUrl });
        });
      });
    });
  }
});
