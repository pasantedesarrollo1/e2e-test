import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { searchBrand, createBrand } from "./harness/brand-helpers.js";

import scenarios from "./0-json-data/brands-search.json" assert { type: "json" };

test.describe("Inventory - Brands (Search)", () => {
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

      test(`ensures brand '${scenario.brandData.name}' can be found via search`, async ({ page }) => {
        
        await test.step('Precondición: Crear la marca por UI', async () => {
          await createBrand(page, {
            ...scenario.brandData,
            tenantBaseUrl
          });
        });

        await test.step('Acción: Buscar la marca', async () => {
          await searchBrand(page, {
            name: scenario.brandData.name,
            tenantBaseUrl
          });
        });
        
      });
    });
  }
});
