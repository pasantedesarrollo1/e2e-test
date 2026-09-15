import { expect, test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { switchAdminSubsidiary } from "../../../../harness/helpers/auth/auth.js";
import {
  getAvailableDocumentOptions,
  getDocumentTypeLocator,
  waitForFormDefaults
} from "../harness/admin-dynamic-documents-helpers.js";
import { selectCheckout as selectCheckoutPreSales } from "../harness/admin-pre-sale-flow.js";

import scenarios from "./0-json-data/admin-pre-sale-dynamic-documents.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Admin Pre-Sales - Dynamic Document Types", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Validates dynamic document type restrictions in Pre-Sales (focus)" : "Validates dynamic document type restrictions in Pre-Sales",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await ensureAuthenticated(page, { 
          targetPath: scenario.targetPath, 
          authType: scenario.authType 
        });

        for (const [index, stepData] of scenario.steps.entries()) {
          await test.step(`Step ${index + 1}: Switch to subsidiary (${stepData.subsidiaryCode}) and validate`, async () => {
            if (index > 0) {
              await switchAdminSubsidiary(page, stepData.subsidiaryName, stepData.subsidiaryCode);
            }
            await selectCheckoutPreSales(page);
            await waitForFormDefaults(page);

            const docInput = await getDocumentTypeLocator(page);
            // Tolerant regex for accents e.g., "Factura electr.nica" to avoid OS encoding issues
            const expectedRegex = new RegExp(stepData.expectedDefault.replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.'), 'i');
            await expect(docInput).toContainText(expectedRegex);

            const options = await getAvailableDocumentOptions(page);
            const hasElectronic = options.some(o => o.includes(stepData.electronicKeyword));
            expect(hasElectronic).toBe(stepData.expectElectronicOption);
          });
        }

        await test.step(`Teardown: Restore original UI context to branch: ${scenario.subsidiaryName}`, async () => {
          await switchAdminSubsidiary(page, scenario.subsidiaryName, scenario.subsidiaryCode);
        });
      }
    );
  });
});
