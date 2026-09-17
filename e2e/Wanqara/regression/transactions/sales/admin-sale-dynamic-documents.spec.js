import { expect, test } from "@playwright/test";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { switchAdminSubsidiary } from "../../../harness/helpers/auth/auth.js";
import {
  getAvailableDocumentOptions,
  getDocumentTypeLocator,
  waitForFormDefaults
} from "./harness/admin-dynamic-documents-helpers.js";

import scenarios from "./0-json-data/admin-sale-dynamic-documents.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";


async function ensureUIReady(page) {
  const profileOverlay = page.locator(".v-overlay--active").filter({ hasText: /Cerrar Sesi.n/i });
  if (await profileOverlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
  }
}

test.describe("Admin Sales - Dynamic Document Types (WS-981)", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Validates dynamic document type restrictions (focus)" : "Validates dynamic document type restrictions",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);
        
        const initialStep = scenario.steps[0];
        await test.step(initialStep.description, async () => {
          await ensureAuthenticated(page, { 
            targetPath: scenario.targetPath, 
            authType: scenario.authType 
          });
          await ensureUIReady(page);
          
          await waitForFormDefaults(page);
          
          const docInput = await getDocumentTypeLocator(page);
          const expectedRegex = new RegExp(initialStep.expectedDefault.replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.'), 'i');
          await expect(docInput).toContainText(expectedRegex);
          
          const options = await getAvailableDocumentOptions(page);
          const hasElectronic = options.some(o => o.includes(initialStep.electronicKeyword));
          expect(hasElectronic).toBe(initialStep.expectElectronicOption);
        });

        for (let i = 1; i < scenario.steps.length; i++) {
          const step = scenario.steps[i];
          await test.step(step.description, async () => {
            await switchAdminSubsidiary(page, step.subsidiaryName, step.subsidiaryCode);
            await ensureUIReady(page);
            
            await waitForFormDefaults(page);
            
            const docInput = await getDocumentTypeLocator(page);
            const expectedRegex = new RegExp(step.expectedDefault.replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.'), 'i');
            await expect(docInput).toContainText(expectedRegex);
            
            const options = await getAvailableDocumentOptions(page);
            const hasElectronic = options.some(o => o.includes(step.electronicKeyword));
            expect(hasElectronic).toBe(step.expectElectronicOption);
          });
        }

        await test.step(`Teardown: Restore original UI context to branch: ${scenario.subsidiaryName}`, async () => {
          await switchAdminSubsidiary(page, scenario.subsidiaryName, scenario.subsidiaryCode);
        });
      }
    );
  });
});
