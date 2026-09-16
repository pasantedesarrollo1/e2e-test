import { expect } from "@playwright/test";
import { ensureAuthenticated, logoutAndLoginAgain } from "../auth/auth.js";
import { playwrightHarness } from "../../config/settings.js";
import { searchInList } from "../crud/crud-helpers.js";

export async function ensureSubsidiaryConfig(
  page,
  businessType,
  dispatchEnabled = false
) {
  const typeOption = page.locator("div[style*='min-width: 90px']")
    .filter({ hasText: new RegExp(businessType, "i") })
    .first();
  await expect(typeOption).toBeVisible({ timeout: 15000 });

  const isAlreadyTargetType = await typeOption.evaluate((el) => el.classList.contains("tw-border-primary"));

  const dispatchContainer = page.locator("div")
    .filter({ hasText: /^Despacho posterior/ })
    .filter({ has: page.locator(".v-switch") })
    .first();
  const switchInput = dispatchContainer.locator("input[type='checkbox']");
  const isDispatchChecked = await switchInput.isVisible() ? await switchInput.isChecked() : false;

  const needsTypeChange = !isAlreadyTargetType;
  const needsDispatchChange = isDispatchChecked !== dispatchEnabled;

  if (!needsTypeChange && !needsDispatchChange) {
    return false; // Indicamos que no hubo cambios
  }

  await page.getByRole("button", { name: /^Editar$/i }).click();

  if (needsTypeChange) {
    await typeOption.click();
    await expect(typeOption).toHaveClass(/tw-border-primary/);
  }

  if (needsDispatchChange) {
    await dispatchContainer.locator(".v-switch").click();
    if (dispatchEnabled) {
      await expect(switchInput).toBeChecked();
    } else {
      await expect(switchInput).not.toBeChecked();
    }
  }

  await page.getByRole("button", { name: /^Guardar$/i }).click();

  const confirmModal = page.locator(".v-overlay__content").filter({ hasText: /Resumen/i }).first();
  await expect(confirmModal).toBeVisible();
  await confirmModal.locator(".v-checkbox input[type='checkbox']").click();
  await confirmModal.getByRole("button", { name: /Confirmar/i }).click();

  const infoModal = page.locator(".v-overlay__content").filter({ hasText: /cierre esta ventana/i }).first();
  await expect(infoModal).toBeVisible();
  await infoModal.getByRole("button", { name: /Entendido/i }).click();

  return true; // Hubo cambios que requieren relogin
}

export async function navigateToSubsidiaryDetail(page, subsidiaryName, subsidiaryCode) {
  await page.goto("/admin/subsidiaries/list");
  
  const fullSearchTerm = `${subsidiaryName} ${subsidiaryCode}`.trim();
  await searchInList(page, fullSearchTerm);
  
  const firstRow = page.locator('.v-data-table__tr').filter({ hasText: subsidiaryCode }).first();
  await expect(firstRow).toBeVisible({ timeout: 15000 });
  
  const rowBtn = firstRow.getByRole('button').first();
  if (await rowBtn.isVisible()) {
      await rowBtn.click();
  } else {
      await firstRow.click();
  }
  
  await page.waitForURL(/\/admin\/subsidiaries\/detail\//, { timeout: 15000 });
}

export async function runEnvSetupFlow(page, { authType, businessType, dispatchEnabled, subsidiaryName, subsidiaryCode }) {
  // Aseguramos que la sesión básica exista y estemos en home admin
  await ensureAuthenticated(page, { targetPath: "/admin/home", authType });

  // Navegamos al detalle de la sucursal buscando por nombre y código
  await navigateToSubsidiaryDetail(page, subsidiaryName, subsidiaryCode);

  // Verificamos y corregimos el config
  const requiresRelogin = await ensureSubsidiaryConfig(page, businessType, dispatchEnabled);

  if (requiresRelogin) {
    const loginCredentials = playwrightHarness.users[authType];
    await logoutAndLoginAgain(page, { login: loginCredentials, subsidiaryName, subsidiaryCode });
  }
}
