/* eslint-disable */
import { test } from '@playwright/test';
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { deleteRecordFromList } from "@/e2e/Wanqara/harness/helpers/admin/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/admin/action-tooltips.js";
import { createWarehouse } from "./harness/warehouses-helpers.js";

import rawScenarios from "./0-json-data/warehouses-crud.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(rawScenarios);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import type { WarehouseOptions } from '@/e2e/Wanqara/regression/settings/configuration/warehouses/harness/warehouses-helpers.js';
type ScenarioData = AdminScenario & {
  authType: string;
  warehouseData: WarehouseOptions;
}



test.describe('Warehouse Management CRUD', () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Successfully create, search, and delete a warehouse (focus)" : "Successfully create, search, and delete a warehouse",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);
        const listPath = '/admin/warehouses/list';

        await test.step('Step 0: Authenticate and Navigate', async () => {
          await ensureAuthenticated(page, {
            targetPath: "/admin/warehouses/list",
            authType: scenario.authType});
        });

        await test.step('Step 1: Clean previous record if it exists', async () => {
          await page.waitForLoadState('networkidle');
          await deleteRecordFromList(page, {
            searchName: scenario.warehouseData.name,
            endpointPattern: '/api/v1/general/warehouses',
            confirmButtonRegex: /^Eliminar$/i,
            successMessage: 'Bodega eliminada correctamente',
            deleteTooltip: ACTION_TOOLTIPS.warehouses.delete
          });
        });

        await test.step('Step 2: Create the new warehouse', async () => {
          await createWarehouse(page, scenario.warehouseData);
        });

        await test.step('Step 3: Verify list and delete the created warehouse', async () => {
          await page.goto(listPath);
          await page.waitForLoadState('networkidle');
          
          await deleteRecordFromList(page, {
            searchName: scenario.warehouseData.name,
            endpointPattern: '/api/v1/general/warehouses',
            confirmButtonRegex: /^Eliminar$/i,
            successMessage: 'Bodega eliminada correctamente',
            deleteTooltip: ACTION_TOOLTIPS.warehouses.delete
          });
        });

      }
    );
  });
});