import { expect } from "@playwright/test";
import { selectDropdownOption } from "../../../../harness/helpers/ui-helpers.js";
import { withPath } from "../../../../harness/config/urls.js";
import { searchInList, clickTableRowAction } from "../../../../harness/helpers/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../harness/helpers/action-tooltips.js";

export async function fillPersonForm(page, data) {
  await page.getByPlaceholder("Nombre completo").fill(data.name);

  const identityTypeInput = page.getByPlaceholder("Seleccione un tipo de identificación");
  await identityTypeInput.click();
  await page.getByRole("option", { name: new RegExp(`^${data.identityType}$`, "i") }).click();

  const identityInput = page.getByPlaceholder("Ingrese el número de identificación");
  await expect(identityInput).not.toBeDisabled();
  await identityInput.fill(data.identity);

  for (const roleRegexStr of data.roles) {
    const roleCard = page.locator(".v-card").filter({ hasText: new RegExp(roleRegexStr, "i") }).first();
    await roleCard.click();
  }

  await selectDropdownOption(page, { triggerLocator: page.getByPlaceholder("Provincia") });
  const cityInput = page.getByPlaceholder(/Ciudad/i).first();
  await expect(cityInput).toBeEnabled({ timeout: 10000 });
  await selectDropdownOption(page, { triggerLocator: cityInput });
}

export async function submitPersonForm(page) {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true });
  await expect(saveBtn).toBeEnabled();

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/general/people") && res.request().method() === "POST" && res.status() === 200
    ),
    saveBtn.click()
  ]);
}

export async function createPerson(page, data) {
  await page.goto(withPath(data.tenantBaseUrl, "/admin/people/add"));
  await expect(page.locator("header").filter({ hasText: "100" }).first()).toBeVisible({ timeout: 15000 });
  await fillPersonForm(page, data);
  await submitPersonForm(page);
}

export async function searchPerson(page, { identity, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/people/list"));
  await searchInList(page, identity);
  const row = page.locator(".v-data-table__tr").filter({ hasText: identity }).first();
  await expect(row).toBeVisible();
}

export async function deactivatePerson(page, { identity, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/people/list"));
  await searchInList(page, identity);
  const row = page.locator(".v-data-table__tr").filter({ hasText: identity }).first();
  
  await expect(row).toBeVisible({ timeout: 15000 });
  await clickTableRowAction(page, row, ACTION_TOOLTIPS.people.delete);

  const confirmBtn = page.getByRole("button", { name: "Confirmar", exact: true });
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/general/people/") && res.request().method() === "DELETE" && res.status() === 200
    ),
    confirmBtn.click()
  ]);
  
  await expect(page.locator(".v-snackbar").filter({ hasText: /persona desactivada/i })).toBeVisible();
}

export async function verifyDeactivatedStrikethrough(page, { identity, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/people/list"));
  await searchInList(page, ""); 
  await searchInList(page, identity);

  const row = page.locator(".v-data-table__tr").filter({ hasText: identity }).first();
  await expect(row).toBeVisible();
  await expect(row).toHaveCSS("text-decoration-line", "line-through");
}
