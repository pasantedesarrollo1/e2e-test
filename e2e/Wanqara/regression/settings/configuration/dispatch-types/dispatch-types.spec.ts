/* eslint-disable */
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { createDispatchType, toggleDispatchTypeState } from "./harness/dispatch-types-helpers.js";

import rawScenarios from "./0-json-data/dispatch-types-crud.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(rawScenarios);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import type { DispatchTypeOptions } from '@/e2e/Wanqara/regression/settings/configuration/dispatch-types/harness/dispatch-types-helpers.js';
type ScenarioData = AdminScenario & {
  authType: string;
  dispatchData: DispatchTypeOptions;
}



test.describe("Settings - Dispatch Types CRUD", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
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
