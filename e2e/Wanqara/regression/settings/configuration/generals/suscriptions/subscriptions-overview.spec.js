import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../../harness/helpers/auth/auth.js";
import {
  validateSubscriptionsOverview,
  validateSubsidiaryCapabilityBadges
} from "./harness/subscriptions-helpers.js";

import scenarios from "./0-json-data/subscriptions-overview.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../../../harness/helpers/test-generator.js";

test.describe("Settings - Subscriptions Overview", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Validates subscriptions against JSON (focus)" : "Validates subscriptions against JSON",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step('Ensure Authenticated (Subscriptions Page)', async () => {
          await ensureAuthenticated(page, { 
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

        await test.step('Ensure Authenticated (Home)', async () => {
          await ensureAuthenticated(page, { 
            targetPath: "/admin/home", 
            authType: scenario.authType 
          });
        });

        await test.step("Validate subsidiary capability badges", async () => {
          await validateSubsidiaryCapabilityBadges(page, { 
            subscriptionData: scenario.subscriptionData 
          });
        });
      }
    );
  });
});