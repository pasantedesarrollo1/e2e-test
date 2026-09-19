/* eslint-disable */
import { expect, type Page, type Locator } from "@playwright/test";

export interface DispatchTypeOptions {
  name: string;
  type: any;
  description: string;
}

export interface ToggleDispatchTypeOptions {
  name: string;
  expectedSnackbarText: any;
}
import { clickTableRowAction } from "@/e2e/Wanqara/harness/helpers/admin/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/admin/action-tooltips.js";

export async function createDispatchType(page: Page, { name, type, description }: DispatchTypeOptions): Promise<void> {
  await page.goto("/admin/dispatch-types/list");
  await page.waitForURL(/\/admin\/dispatch-types\/list/);

  await page.getByRole("link", { name: /Agregar Tipo de Despacho/i }).click();
  await page.waitForURL(/\/admin\/dispatch-types\/add/);

  await page.getByPlaceholder("Ingrese el nombre del tipo de despacho").fill(name);
  
  await page.getByPlaceholder("Seleccione un tipo de despacho").click();
  await page.getByRole("option", { name: new RegExp(`^${type}$`, "i") }).click();
  
  await page.getByPlaceholder(/Ingrese una descripci.n/i).fill(description);

  const saveBtn = page.getByRole("button", { name: /^Guardar$/i });
  
  await Promise.all([
    page.waitForResponse(res => res.url().includes("/api/v1/general/dispatch-types") && res.request().method() === "POST" && res.status() === 201),
    saveBtn.click()
  ]);

  await expect(page.locator(".v-snackbar").filter({ hasText: /Tipo de Despacho creado con .xito/i })).toBeVisible();
}

export async function toggleDispatchTypeState(page: Page, { name, expectedSnackbarText }: ToggleDispatchTypeOptions): Promise<void> {
  await page.goto("/admin/dispatch-types/list");
  await page.waitForURL(/\/admin\/dispatch-types\/list/);

  const row = page.locator(".v-data-table__tr").filter({ hasText: name }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  
  await clickTableRowAction(page, row, ACTION_TOOLTIPS.dispatchTypes.view);
  
  await page.getByRole("button", { name: /^Editar$/i }).click();

  await page.locator(".v-switch").first().click();

  const saveBtn = page.getByRole("button", { name: /^Guardar$/i });

  await Promise.all([
    page.waitForResponse(res => res.url().includes("/api/v1/general/dispatch-types/") && res.request().method() === "PATCH" && res.status() === 200),
    saveBtn.click()
  ]);

  await expect(page.locator(".v-snackbar").filter({ hasText: expectedSnackbarText })).toBeVisible();
}
