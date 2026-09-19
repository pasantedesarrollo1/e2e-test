/* eslint-disable */
import { test } from '@playwright/test';
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { deleteRecordFromList } from "@/e2e/Wanqara/harness/helpers/admin/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/admin/action-tooltips.js";
import { createSubsidiary } from "./harness/subsidiaries-helpers.js";

import rawScenarios from "./0-json-data/subsidiaries-crud.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(rawScenarios);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import type { SubsidiaryOptions } from '@/e2e/Wanqara/regression/settings/configuration/subsidiaries/harness/subsidiaries-helpers.js';
type ScenarioData = AdminScenario & {
  authType: string;
  subsidiaryData: SubsidiaryOptions & { type: string };
}



test.describe('Subsidiary Management CRUD', () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? `Successfully create, search, and delete: ${scenario.subsidiaryData.type} (focus)` : `Successfully create, search, and delete: ${scenario.subsidiaryData.type}`,
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);
        const listPath = '/admin/subsidiaries/list';

        await test.step('Step 0: Authenticate and Navigate', async () => {
          await ensureAuthenticated(page, {
            targetPath: "/admin/subsidiaries/list",
            authType: scenario.authType});
        });

        await test.step('Step 1: Clean previous record if it exists', async () => {
          await page.waitForLoadState('networkidle');
          await deleteRecordFromList(page, {
            searchName: scenario.subsidiaryData.name,
            endpointPattern: '/api/v1/general/subsidiaries/',
            confirmButtonRegex: /^Eliminar Sucursal$/i,
            successMessage: 'eliminada',
            deleteTooltip: ACTION_TOOLTIPS.subsidiaries.delete
          });
        });

        await test.step('Step 2: Create the new subsidiary', async () => {
          await createSubsidiary(page, scenario.subsidiaryData as any);
        });

        await test.step('Step 3: Verify list and delete the created subsidiary', async () => {
          await page.goto(listPath);
          await page.waitForLoadState('networkidle');
          await deleteRecordFromList(page, {
            searchName: scenario.subsidiaryData.name,
            endpointPattern: '/api/v1/general/subsidiaries/',
            confirmButtonRegex: /^Eliminar Sucursal$/i,
            successMessage: 'eliminada',
            deleteTooltip: ACTION_TOOLTIPS.subsidiaries.delete
          });
        });
      }
    );
  });
});