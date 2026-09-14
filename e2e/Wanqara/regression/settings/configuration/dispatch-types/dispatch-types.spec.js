import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../../harness/helpers/reporting/annotate.js";
import { createDispatchType, toggleDispatchTypeState } from "./harness/dispatch-types-helpers.js";

import scenarios from "./0-json-data/dispatch-types-crud.json" assert { type: "json" };

test.describe("Settings - Dispatch Types CRUD", () => {
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
        scenario.only ? "completes the full lifecycle of a dispatch type (focus)" : "completes the full lifecycle of a dispatch type",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step('Ensure Authenticated', async () => {
            await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/dispatch-types/list", authType: scenario.authType });
          });

          await test.step("Crear Tipo de Despacho", async () => {
            await createDispatchType(page, { ...scenario.dispatchData, tenantBaseUrl });
          });

          await test.step("Desactivar Tipo de Despacho", async () => {
            await toggleDispatchTypeState(page, { 
              name: scenario.dispatchData.name, 
              expectedSnackbarText: /Tipo de Despacho actualizado con .xito/i,
              tenantBaseUrl 
            });
          });

          await test.step("Activar Tipo de Despacho", async () => {
            await toggleDispatchTypeState(page, { 
              name: scenario.dispatchData.name, 
              expectedSnackbarText: /Tipo de Despacho actualizado con .xito/i,
              tenantBaseUrl 
            });
          });
        }
      );
    });
  }
});