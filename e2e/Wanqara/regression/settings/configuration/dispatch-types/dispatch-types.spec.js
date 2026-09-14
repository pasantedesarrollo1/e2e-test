import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { createDispatchType, toggleDispatchTypeState } from "./harness/dispatch-types-helpers.js";

import scenarios from "./0-json-data/dispatch-types-crud.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe("Settings - Dispatch Types CRUD", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "completes the full lifecycle of a dispatch type (focus)" : "completes the full lifecycle of a dispatch type",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step('Ensure Authenticated', async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/dispatch-types/list", authType: scenario.authType });
        });

        await test.step("Crear Tipo de Despacho", async () => {
          await createDispatchType(page, { ...scenario.dispatchData });
        });

        await test.step("Desactivar Tipo de Despacho", async () => {
          await toggleDispatchTypeState(page, { 
            name: scenario.dispatchData.name, 
            expectedSnackbarText: /Tipo de Despacho actualizado con .xito/i 
          });
        });

        await test.step("Activar Tipo de Despacho", async () => {
          await toggleDispatchTypeState(page, { 
            name: scenario.dispatchData.name, 
            expectedSnackbarText: /Tipo de Despacho actualizado con .xito/i 
          });
        });
      }
    );
  });
});