import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { fillDiscountForm, assertDiscountSummary } from "./harness/discount-helpers.js";

import scenarios from "./0-json-data/discounts-summary.json" assert { type: "json" };

test.describe("Inventory - Discounts (Summary Rendering)", () => {
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

      test(`verifies discount summary for ${scenario.discountData.applicationMethod} + ${scenario.discountData.type}`, async ({ page }) => {
        await test.step("Navigate to the add discount form", async () => {
          await fillDiscountForm(page, {
            ...scenario.discountData,
            tenantBaseUrl
          });
        });

        await test.step("Verify the summary panel reflects the selected options", async () => {
          await assertDiscountSummary(page, scenario.discountData);
        });
      });
    });
  }
});
