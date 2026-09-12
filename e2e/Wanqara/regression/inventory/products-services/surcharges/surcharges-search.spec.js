import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { createSurcharge, searchSurcharge } from "./harness/surcharge-helpers.js";

import scenarios from "./0-json-data/surcharges-search.json" assert { type: "json" };

test.describe("Inventory - Surcharges (Search)", () => {
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
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(`ensures surcharge '${scenario.surchargeData.name}' can be found via search`, async ({ page }) => {
        await test.step('Precondición: Crear el recargo por UI', async () => {
          await createSurcharge(page, {
            ...scenario.surchargeData,
            tenantBaseUrl
          });
        });
        await test.step('Acción: Buscar el recargo', async () => {
          await searchSurcharge(page, {
            name: scenario.surchargeData.name,
            tenantBaseUrl
          });
        });
      });
    });
  }
});
