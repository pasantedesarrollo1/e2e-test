import { test } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/auth.js";
import { filterByWaiter } from "../harness/waiter-filter-flow.js";

const TICKET = {
  ws: 'WS-1000',
  tes: 'TES-209',
  release: 'v7.9.1',
  summary: 'Orders Reconciliations Waiter Filter',
  addedToRegression: 'true',
};

test.describe("Orders Reconciliations — Waiter Filter @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("filters reconciliations by waiter using advanced search", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to orders reconciliations list", async () => {
      await ensureAuthenticated(page, {
        tenantBaseUrl,
        targetPath: "/admin/orders-reconciliations/list",
        authType: "restaurant",
      });
    });

    await test.step("Filter by waiter and validate results", async () => {
      await filterByWaiter(page, {
        waiterName: "QA developer 1",
        searchKeyword: "QA",
        apiEndpointPattern: "/api/v1/inventory/reconciliations/orders",
      });
    });
  });
});