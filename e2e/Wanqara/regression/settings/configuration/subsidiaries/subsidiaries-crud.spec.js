import { test } from '@playwright/test';
import { annotateTicket } from "../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from '../../../../harness/config/settings.js';
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth.js";
import { withPath } from '../../../../harness/config/urls.js';
import { deleteRecordFromList } from '../../../../harness/helpers/crud-helpers.js';
import { ACTION_TOOLTIPS } from '../../../../harness/helpers/action-tooltips.js';
import { createSubsidiary } from "./harness/subsidiaries-helpers.js";

import scenarios from "./0-json-data/subsidiaries-crud.json" assert { type: "json" };

test.describe('Subsidiary Management CRUD', () => {
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
        scenario.only ? `Successfully create, search, and delete: ${scenario.subsidiaryData.type} (focus)` : `Successfully create, search, and delete: ${scenario.subsidiaryData.type}`,
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();
          const listPath = withPath(tenantBaseUrl, '/admin/subsidiaries/list');

          await test.step('Step 0: Authenticate and Navigate', async () => {
            await ensureAuthenticated(page, {
              tenantBaseUrl,
              targetPath: "/admin/subsidiaries/list",
              authType: scenario.authType,
            });
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
            await createSubsidiary(page, scenario.subsidiaryData);
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
  }
});