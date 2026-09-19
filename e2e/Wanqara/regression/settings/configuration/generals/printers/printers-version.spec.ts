/* eslint-disable */
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { getSuggestedPrinterVersion, verifyVersionOnGithub } from "./harness/printers-helpers.js";

import rawScenarios from "./0-json-data/printers-version.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(rawScenarios);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import type { VerifyVersionOptions } from '@/e2e/Wanqara/regression/settings/configuration/generals/printers/harness/printers-helpers.js';
type ScenarioData = AdminScenario & {
  authType: string;
  printerData: VerifyVersionOptions;
}



test.describe.serial("Settings - Printers Configuration", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Verify Suggested Printer Version Exists on GitHub Releases (focus)" : "Verify Suggested Printer Version Exists on GitHub Releases",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step('Ensure Authenticated (Printers Page)', async () => {
          await ensureAuthenticated(page, { 
            targetPath: "/admin/settings/printers", 
            authType: scenario.authType 
          });
        });

        let dynamicVersion: string = "";
        await test.step("Extract dynamic version from Printers page", async () => {
          dynamicVersion = await getSuggestedPrinterVersion(page, );
        });

        await test.step("Verify dynamic version exists on GitHub", async () => {
          await verifyVersionOnGithub(page, { 
            dynamicVersion, 
            githubReleasesUrl: scenario.printerData.githubReleasesUrl 
          });
        });
      }
    );
  });
});
