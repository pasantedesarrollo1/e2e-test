/* eslint-disable */
import { expect, test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { searchInList } from "@/e2e/Wanqara/harness/helpers/admin/crud-helpers.js";
import {
  acceptTerms,
  checkFormFilledCorrectly,
  clickSiguiente,
  fillObservation,
  fillWhatsapp,
  navigateToCreateTicket,
  selectFirstCategory,
  selectFirstDateAndSlot,
  selectFirstService
} from "./harness/support-tickets-helpers.js";

import rawScenarios from "./0-json-data/support-tickets.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(rawScenarios);
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
interface TicketData {
  whatsapp: string;
  observation: string;
  searchId: string;
}
type ScenarioData = AdminScenario & {
  authType: string;
  ticketData: TicketData;
}



test.describe("Settings - Support Tickets", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Support Tickets - Create (focus)" : "Support Tickets - Create",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Navigate to the support tickets list and open the create form", async () => {
          await navigateToCreateTicket(page, scenario.authType);
        });

        await test.step("Select the first available category", async () => {
          await selectFirstCategory(page);
        });

        await test.step("Advance to the ticket form", async () => {
          await clickSiguiente(page);
        });

        await test.step("Select the first available service from the dropdown", async () => {
          await selectFirstService(page);
        });

        await test.step("Select the first available date and time slot", async () => {
          await selectFirstDateAndSlot(page);
        });

        await test.step("Enter the WhatsApp contact number", async () => {
          await fillWhatsapp(page, scenario.ticketData.whatsapp);
        });

        await test.step("Describe the problem in the observation field", async () => {
          await fillObservation(page, scenario.ticketData.observation);
        });

        await test.step("Accept the terms and conditions", async () => {
          await acceptTerms(page);
        });

        await test.step("Verify the form is filled correctly and ready to submit", async () => {
          await checkFormFilledCorrectly(page);
        });
      }
    );

    test(
      scenario.only ? "Support Tickets - Search (focus)" : "Support Tickets - Search",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(60_000);
        const { searchId } = scenario.ticketData;

        await test.step("Navigate to the support tickets list", async () => {
          await ensureAuthenticated(page, {
            targetPath: "/admin/support/tickets/list",
            authType: scenario.authType});
        });

        await test.step("Execute search and validate API request", async () => {
          const searchResponsePromise = page.waitForResponse(
            (res) =>
              res.url().includes("/api/v1/support/tickets") &&
              res.url().includes(searchId) &&
              res.request().method() === "GET" &&
              res.status() === 200
          );

          await searchInList(page, searchId);
          await searchResponsePromise;
        });

        await test.step("Verify the ticket code appears in the first column of the first row", async () => {
          const firstRow = page.locator(".v-data-table__tr").first();
          await expect(firstRow).toBeVisible();

          const firstColumn = firstRow.locator("td").first();
          await expect(firstColumn).toContainText(searchId);
        });
      }
    );
  });
});