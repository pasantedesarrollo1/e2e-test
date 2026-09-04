import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../../harness/auth.js";
import { searchInList } from "../../../../harness/crud-helpers.js";

const TICKET = {
  ws: 'WS-986',
  tes: 'TES-210',
  release: 'v7.9.1',
  summary: 'Support Tickets Search',
  addedToRegression: 'true',
};

const tenantBaseUrl = getTenantBaseUrl();

test.describe("Support Tickets — Search @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("searches for a specific ticket ID and validates the API response and table data", async ({ page }) => {
    test.setTimeout(60_000);
    const searchId = "17902";

    await test.step("Navigate to the support tickets list", async () => {
      await ensureAuthenticated(page, {
        tenantBaseUrl,
        targetPath: "/admin/support/tickets/list",
        authType: "retail",
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
  });
});