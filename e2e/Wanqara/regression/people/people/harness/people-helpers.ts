import { expect, type Page } from "@playwright/test";
import { clickTableRowAction, searchInList } from "@/e2e/Wanqara/harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/ui/action-tooltips.js";
import { selectDropdownOption } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

export interface PersonData {
  name: string;
  identityType: string;
  identity: string;
  roles: string[];
}

export async function fillPersonForm(page: Page, data: PersonData): Promise<void> {
  await page.getByPlaceholder("Nombre completo").fill(data.name);

  const identityTypeInput = page.getByPlaceholder("Seleccione un tipo de identificación");
  await identityTypeInput.click();
  await page.getByRole("option", { name: new RegExp(`^${data.identityType}$`, "i") }).click();

  const identityInput = page.getByPlaceholder("Ingrese el número de identificación");
  await expect(identityInput).toBeEnabled();
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

export async function submitPersonForm(page: Page): Promise<void> {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true });
  await expect(saveBtn).toBeEnabled();

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/general/people") && res.request().method() === "POST" && res.status() === 200
    ),
    saveBtn.click()
  ]);
}

export async function createPerson(page: Page, data: PersonData): Promise<void> {
  await page.goto("/admin/people/add");
  await expect(page.locator("header").filter({ hasText: "100" }).first()).toBeVisible({ timeout: 15000 });
  await fillPersonForm(page, data);
  await submitPersonForm(page);
}

export interface PersonSearchOptions {
  identity: string;
}

export async function searchPerson(page: Page, { identity }: PersonSearchOptions): Promise<void> {
  await page.goto("/admin/people/list");
  await searchInList(page, identity);
  const row = page.locator(".v-data-table__tr").filter({ hasText: identity }).first();
  await expect(row).toBeVisible();
}

export async function deactivatePerson(page: Page, { identity }: PersonSearchOptions): Promise<void> {
  await page.goto("/admin/people/list");
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

export async function ensureCleanPerson(page: Page, { identity }: PersonSearchOptions): Promise<void> {
  await page.goto("/admin/people/list");
  await searchInList(page, identity);
  
  const row = page.locator(".v-data-table__tr").filter({ hasText: identity }).first();
  const isVisible = await row.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (isVisible) {
    const isStrikethrough = await row.evaluate(el => window.getComputedStyle(el).textDecorationLine === 'line-through').catch(() => false);
    if (!isStrikethrough) {
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
  }
}

export async function verifyDeactivatedStrikethrough(page: Page, { identity }: PersonSearchOptions): Promise<void> {
  await page.goto("/admin/people/list");
  await searchInList(page, ""); 
  await searchInList(page, identity);

  const row = page.locator(".v-data-table__tr").filter({ hasText: identity }).first();
  await expect(row).toBeVisible();
  await expect(row).toHaveCSS("text-decoration-line", "line-through");
}
