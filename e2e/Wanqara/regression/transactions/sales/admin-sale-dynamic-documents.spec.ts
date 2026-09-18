/* eslint-disable */
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { switchAdminSubsidiary } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import {
  getAvailableDocumentOptions,
  getDocumentTypeLocator,
  waitForFormDefaults
} from "./harness/admin-dynamic-documents-helpers.js";

import scenariosRaw from "./0-json-data/admin-sale-dynamic-documents.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface StepParams { description: string; expectedDefault: string; electronicKeyword: string; expectElectronicOption: boolean; subsidiaryName: string; subsidiaryCode: string; branchName: string; warehouseName?: string; }

interface ScenarioData extends ScenarioDefinition, TestMetadata {
  authType: string;
  targetPath: string;
  subsidiaryName: string;
  subsidiaryCode: string;
  steps: StepParams[];
}



async function ensureUIReady(page: Page) {
  const profileOverlay = page.locator(".v-overlay--active").filter({ hasText: /Cerrar Sesi.n/i });
  if (await profileOverlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
  }
}

test.describe("Admin Sales - Dynamic Document Types (WS-981)", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Validates dynamic document type restrictions (focus)" : "Validates dynamic document type restrictions",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);
        
        const initialStep = scenario.steps[0];
        await test.step(initialStep.description as string, async () => {
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
          await test.step(step.description as string, async () => {
            await switchAdminSubsidiary(page, step.subsidiaryName as string, step.subsidiaryCode as string);
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
