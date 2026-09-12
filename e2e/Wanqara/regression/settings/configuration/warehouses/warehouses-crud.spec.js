import { test } from '@playwright/test';
import { annotateTicket } from "../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from '../../../../harness/config/settings.js';
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth.js";
import { withPath } from '../../../../harness/config/urls.js';
import { deleteRecordFromList } from '../../../../harness/helpers/crud-helpers.js';
import { ACTION_TOOLTIPS } from '../../../../harness/helpers/action-tooltips.js';
import { createWarehouse } from "./harness/warehouses-helpers.js";

import scenarios from "./0-json-data/warehouses-crud.json" assert { type: "json" };

test.describe('Warehouse Management CRUD', () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(
        scenario.only ? "Successfully create, search, and delete a warehouse (focus)" : "Successfully create, search, and delete a warehouse",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();
          const listPath = withPath(tenantBaseUrl, '/admin/warehouses/list');

          await test.step('Step 0: Authenticate and Navigate', async () => {
            await ensureAuthenticated(page, {
              tenantBaseUrl,
              targetPath: "/admin/warehouses/list",
              authType: scenario.authType,
            });
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
  }
});