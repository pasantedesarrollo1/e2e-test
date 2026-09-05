import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath } from "../../../../harness/auth.js";
import { SEED } from "../../../../harness/seed.js";
import { withPath } from "../../../../harness/urls.js";
import { clickTableRowAction } from "../../../../harness/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../harness/action-tooltips.js";

const TICKET = {
  ws: 'WS-983',
  tes: 'TES-208',
  release: 'v7.9.1',
  summary: 'Dispatch Types',
  addedToRegression: null,
};

test.describe("Settings — Dispatch Types @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("completes the full lifecycle of a dispatch type", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Create dispatch type", async () => {
      await page.goto(withPath(tenantBaseUrl, "/admin/dispatch-types/list"));
      await page.waitForURL(/\/admin\/dispatch-types\/list/);

      await page.getByRole("link", { name: /Agregar Tipo de Despacho/i }).click();
      await page.waitForURL(/\/admin\/dispatch-types\/add/);

      await page.getByPlaceholder("Ingrese el nombre del tipo de despacho").fill(SEED.dispatchTypes.crud.name);
      
      await page.getByPlaceholder("Seleccione un tipo de despacho").click();
      await page.getByRole("option", { name: new RegExp(`^${SEED.dispatchTypes.crud.type}$`, "i") }).click();
      
      await page.getByPlaceholder("Ingrese una descripción").fill(SEED.dispatchTypes.crud.description);

      const saveBtn = page.getByRole("button", { name: /^Guardar$/i });
      
      await Promise.all([
        page.waitForResponse(res => res.url().includes("/api/v1/general/dispatch-types") && res.request().method() === "POST" && res.status() === 201),
        saveBtn.click()
      ]);

      await expect(page.locator(".v-snackbar").filter({ hasText: /Tipo de Despacho creado con éxito/i })).toBeVisible();
    });

    await test.step("Deactivate dispatch type", async () => {
      await page.goto(withPath(tenantBaseUrl, "/admin/dispatch-types/list"));
      await page.waitForURL(/\/admin\/dispatch-types\/list/);

      const row = page.locator(".v-data-table__tr").filter({ hasText: SEED.dispatchTypes.crud.name }).first();
      await expect(row).toBeVisible();
      
      await clickTableRowAction(page, row, ACTION_TOOLTIPS.dispatchTypes.view);
      
      await page.getByRole("button", { name: /^Editar$/i }).click();

      await page.locator(".v-switch").first().click();

      const saveBtn = page.getByRole("button", { name: /^Guardar$/i });

      await Promise.all([
        page.waitForResponse(res => res.url().includes("/api/v1/general/dispatch-types/") && res.request().method() === "PATCH" && res.status() === 200),
        saveBtn.click()
      ]);

      await expect(page.locator(".v-snackbar").filter({ hasText: /Tipo de Despacho actualizado con éxito/i })).toBeVisible();
    });

    await test.step("Activate dispatch type", async () => {
      await page.goto(withPath(tenantBaseUrl, "/admin/dispatch-types/list"));
      await page.waitForURL(/\/admin\/dispatch-types\/list/);

      const row = page.locator(".v-data-table__tr").filter({ hasText: SEED.dispatchTypes.crud.name }).first();
      await expect(row).toBeVisible();

      await clickTableRowAction(page, row, ACTION_TOOLTIPS.dispatchTypes.view);

      await page.getByRole("button", { name: /^Editar$/i }).click();

      await page.locator(".v-switch").first().click();

      const saveBtn = page.getByRole("button", { name: /^Guardar$/i });

      await Promise.all([
        page.waitForResponse(res => res.url().includes("/api/v1/general/dispatch-types/") && res.request().method() === "PATCH" && res.status() === 200),
        saveBtn.click()
      ]);

      await expect(page.locator(".v-snackbar").filter({ hasText: /Tipo de Despacho actualizado con éxito/i })).toBeVisible();
    });
  });
});