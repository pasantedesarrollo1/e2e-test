import { test } from "@playwright/test";
import { annotateTicket } from "../../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../../harness/helpers/auth.js";
import { getSuggestedPrinterVersion, verifyVersionOnGithub } from "./harness/printers-helpers.js";

import scenarios from "./0-json-data/printers-version.json" assert { type: "json" };

test.describe.serial("Settings - Printers Configuration", () => {
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
        scenario.only ? "Verify Suggested Printer Version Exists on GitHub Releases (focus)" : "Verify Suggested Printer Version Exists on GitHub Releases",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step('Ensure Authenticated (Printers Page)', async () => {
            await ensureAuthenticated(page, { 
              tenantBaseUrl, 
              targetPath: "/admin/settings/printers", 
              authType: scenario.authType 
            });
          });

          let dynamicVersion;
          await test.step("Extract dynamic version from Printers page", async () => {
            dynamicVersion = await getSuggestedPrinterVersion(page, { tenantBaseUrl });
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
  }
});
