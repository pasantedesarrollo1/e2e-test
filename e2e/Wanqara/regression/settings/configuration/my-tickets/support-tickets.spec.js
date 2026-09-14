import { expect, test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../../../harness/config/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../../harness/helpers/auth/auth.js";
import { searchInList } from "../../../../harness/helpers/crud/crud-helpers.js";
import { annotateTicket } from "../../../../harness/helpers/reporting/annotate.js";
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

import scenarios from "./0-json-data/support-tickets.json" assert { type: "json" };

test.describe("Settings - Support Tickets", () => {
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
        scenario.only ? "Support Tickets - Create (focus)" : "Support Tickets - Create",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Navigate to the support tickets list and open the create form", async () => {
            await navigateToCreateTicket(page, tenantBaseUrl, scenario.authType);
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
          const tenantBaseUrl = getTenantBaseUrl();
          const { searchId } = scenario.ticketData;

          await test.step("Navigate to the support tickets list", async () => {
            await ensureAuthenticated(page, {
              tenantBaseUrl,
              targetPath: "/admin/support/tickets/list",
              authType: scenario.authType,
            });
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
  }
});