import { test, expect } from "@playwright/test";
import { annotateTicket } from "../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath } from "../harness/auth.js";
import { withPath } from "../harness/urls.js";

const TICKET = {
  ws: 'WS-1000',
  tes: 'TES-209',
  release: 'v7.9.1',
  summary: 'Orders Reconciliations Waiter Filter',
  addedToRegression: null,
};

test.describe("Orders Reconciliations - Waiter Filter @release", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("filters reconciliations by waiter using advanced search", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await page.goto(withPath(tenantBaseUrl, "/admin/orders-reconciliations/list"));
    await page.waitForURL(/\/admin\/orders-reconciliations\/list/);

    await page.getByRole("button", { name: /Búsqueda Avanzada/i }).click();

    await page.locator(".v-chip").filter({ hasText: "Mesero" }).click();

    await page.getByRole("button", { name: /Seleccionar mesero/i }).click();

    const searchInput = page.getByRole("dialog").getByRole("textbox", { name: /Busca lo que necesites/i });
    
    const usersSearchResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/general/users") &&
        res.url().includes("QA") &&
        res.request().method() === "GET" &&
        res.status() === 200
    );
    
    await searchInput.fill("QA developer 1");
    await usersSearchResponsePromise;

    await page.getByRole("dialog").getByRole("button", { name: "Seleccionar", exact: true }).first().click();


    const ordersResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/inventory/reconciliations/orders") &&
        res.url().includes("user_id") &&
        res.request().method() === "GET" &&
        res.status() === 200
    );

    await page.getByRole("button", { name: "Filtrar", exact: true }).click();
    await ordersResponsePromise;

    const resultsTable = page.locator(".v-data-table").first();
    await expect(resultsTable).toBeVisible();
  });
});