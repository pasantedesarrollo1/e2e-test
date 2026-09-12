import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/helpers/auth.js";
import { getElectronicInvoicingAuthType } from "../../../harness/config/seed.js";
import {
  getAvailableDocumentOptions,
  waitForFormDefaults,
  getDocumentTypeLocator
} from "./harness/admin-dynamic-documents-helpers.js";
import { switchAdminSubsidiary } from "./harness/admin-document-helpers.js";

import scenarios from "./0-json-data/admin-sale-dynamic-documents.json" assert { type: "json" };

const tenantBaseUrl = getTenantBaseUrl();

async function ensureUIReady(page) {
  const profileOverlay = page.locator(".v-overlay--active").filter({ hasText: /Cerrar Sesi.n/i });
  if (await profileOverlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
  }
}

test.describe("Admin Sales - Dynamic Document Types (WS-981)", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(getElectronicInvoicingAuthType()) });

      test(
        scenario.only ? "Validates dynamic document type restrictions (focus)" : "Validates dynamic document type restrictions",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          
          const initialStep = scenario.steps[0];
          await test.step(initialStep.description, async () => {
            await ensureAuthenticated(page, { 
              tenantBaseUrl, 
              targetPath: scenario.targetPath, 
              authType: getElectronicInvoicingAuthType() 
            });
            await ensureUIReady(page);
            
            await waitForFormDefaults(page);
            
            const docInput = await getDocumentTypeLocator(page);
            // Tolerant regex for accents
            const expectedRegex = new RegExp(initialStep.expectedDefault.replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.'), 'i');
            await expect(docInput).toContainText(expectedRegex);
            
            const options = await getAvailableDocumentOptions(page);
            const hasElectronic = options.some(o => o.includes("Factura"));
            expect(hasElectronic).toBe(initialStep.expectElectronicOption);
          });

          // Execute remaining steps
          for (let i = 1; i < scenario.steps.length; i++) {
            const step = scenario.steps[i];
            await test.step(step.description, async () => {
              await switchAdminSubsidiary(page, step.subsidiaryCode);
              await ensureUIReady(page);
              
              await waitForFormDefaults(page);
              
              const docInput = await getDocumentTypeLocator(page);
              // Tolerant regex for accents
              const expectedRegex = new RegExp(step.expectedDefault.replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.'), 'i');
              await expect(docInput).toContainText(expectedRegex);
              
              const options = await getAvailableDocumentOptions(page);
              const hasElectronic = options.some(o => o.includes("Factura"));
              expect(hasElectronic).toBe(step.expectElectronicOption);
            });
          }
        }
      );
    });
  }
});