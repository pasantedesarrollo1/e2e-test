import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/helpers/auth.js";
import { createPerson, deactivatePerson, verifyDeactivatedStrikethrough } from "./harness/people-helpers.js";

import scenarios from "./0-json-data/people-delete.json" assert { type: "json" };

test.describe("People Management - Delete (Deactivate)", () => {
  requirePosCredentials(test);
  const tenantBaseUrl = getTenantBaseUrl();

  for (const scenario of scenarios) {
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuración en JSON';
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

      test("desactiva una persona y verifica el tachado", async ({ page }) => {
        test.setTimeout(90_000);
        await test.step('Garantizar autenticación', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/people/list", authType: scenario.authType });
        });

        await test.step('PRECONDICIÓN: Crear Persona', async () => {
          await createPerson(page, { ...scenario.personData, tenantBaseUrl });
        });

        await test.step('Desactivar Persona', async () => {
          await deactivatePerson(page, { identity: scenario.personData.identity, tenantBaseUrl });
        });

        await test.step('Verificar que la persona aparece tachada (line-through)', async () => {
          await verifyDeactivatedStrikethrough(page, { identity: scenario.personData.identity, tenantBaseUrl });
        });
      });
    });
  }
});
