import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/helpers/auth.js";
import { createPerson } from "./harness/people-helpers.js";

import scenarios from "./0-json-data/people-create.json" assert { type: "json" };

test.describe("People Management - Create", () => {
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

      test("crea una nueva persona", async ({ page }) => {
        test.setTimeout(60_000);
        await test.step('Garantizar autenticación', async () => {
          await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/people/list", authType: scenario.authType });
        });

        await test.step('Crear Persona', async () => {
          await createPerson(page, { ...scenario.personData, tenantBaseUrl });
        });
      });
    });
  }
});
