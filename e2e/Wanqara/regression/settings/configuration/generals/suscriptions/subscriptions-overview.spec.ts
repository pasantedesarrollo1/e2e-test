/* eslint-disable */
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import {
  validateSubscriptionsOverview,
  validateSubsidiaryCapabilityBadges
} from "./harness/subscriptions-helpers.js";

import rawScenarios from "./0-json-data/subscriptions-overview.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(rawScenarios);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import type { SubscriptionData } from '@/e2e/Wanqara/regression/settings/configuration/generals/suscriptions/harness/subscriptions-helpers.js';
interface ScenarioData extends FlatScenario {
  authType: string;
  subscriptionData: SubscriptionData;
}



test.describe("Settings - Subscriptions Overview", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
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