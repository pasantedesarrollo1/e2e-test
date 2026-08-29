import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath } from "../harness/auth.js";
import { withPath } from "../harness/urls.js";

test.describe("Orders - Waiter Filter @release", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("filters orders by waiter using advanced search", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await page.goto(withPath(tenantBaseUrl, "/admin/orders/list"));
    await page.waitForURL(/\/admin\/orders\/list/);

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
        res.url().includes("/api/v1/restaurant/orders") &&
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