import { expect } from "@playwright/test";

export async function filterByWaiter(page, { waiterName, searchKeyword, apiEndpointPattern }) {
  await page.getByRole("button", { name: /Búsqueda Avanzada/i }).click();

  await page.locator(".v-chip").filter({ hasText: "Mesero" }).click();

  await page.getByRole("button", { name: /Seleccionar mesero/i }).click();

  const searchInput = page.getByRole("dialog").getByRole("textbox", { name: /Busca lo que necesites/i });
  
  const usersSearchResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/general/users") &&
      res.url().includes(searchKeyword) &&
      res.request().method() === "GET" &&
      res.status() === 200
  );
  
  await searchInput.fill(waiterName);
  await usersSearchResponsePromise;

  await page.getByRole("dialog").getByRole("button", { name: "Seleccionar", exact: true }).first().click();

  const ordersResponsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(apiEndpointPattern) &&
      res.url().includes("user_id") &&
      res.request().method() === "GET" &&
      res.status() === 200
  );

  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await ordersResponsePromise;

  const resultsTable = page.locator(".v-data-table").first();
  await expect(resultsTable).toBeVisible();
}