import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../../harness/helpers/auth/auth.js";
import { getSuggestedPrinterVersion, verifyVersionOnGithub } from "./harness/printers-helpers.js";

import scenarios from "./0-json-data/printers-version.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../../harness/helpers/test-generator.js";

test.describe.serial("Settings - Printers Configuration", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
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

        let dynamicVersion;
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
