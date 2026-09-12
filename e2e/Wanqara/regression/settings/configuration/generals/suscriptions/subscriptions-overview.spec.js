import { test } from "@playwright/test";
import { annotateTicket } from "../../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../../harness/helpers/auth.js";
import { 
  validateSubscriptionsOverview, 
  validateSubsidiaryCapabilityBadges 
} from "./harness/subscriptions-helpers.js";

import scenarios from "./0-json-data/subscriptions-overview.json" assert { type: "json" };

test.describe("Settings - Subscriptions Overview", () => {
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
        scenario.only ? "Validates subscriptions against JSON (focus)" : "Validates subscriptions against JSON",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step('Ensure Authenticated (Subscriptions Page)', async () => {
            await ensureAuthenticated(page, { 
              tenantBaseUrl, 
              targetPath: "/admin/settings/subscriptions", 
              authType: scenario.authType 
            });
          });

          await test.step("Validate subscription cards", async () => {
            await validateSubscriptionsOverview(page, scenario.subscriptionData);
          });
        }
      );

      test(
        scenario.only ? "Validates capability badges in subsidiary form (focus)" : "Validates capability badges in subsidiary form",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(60_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step('Ensure Authenticated (Home)', async () => {
            await ensureAuthenticated(page, { 
              tenantBaseUrl, 
              targetPath: "/admin/home", 
              authType: scenario.authType 
            });
          });

          await test.step("Validate subsidiary capability badges", async () => {
            await validateSubsidiaryCapabilityBadges(page, { 
              subscriptionData: scenario.subscriptionData, 
              tenantBaseUrl 
            });
          });
        }
      );
    });
  }
});