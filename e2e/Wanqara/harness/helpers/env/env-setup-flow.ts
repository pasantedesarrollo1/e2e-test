import { expect, type Page, type Locator } from "@playwright/test";
import { ensureAuthenticated, logoutAndLoginAgain } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { playwrightHarness } from "@/e2e/Wanqara/harness/config/settings.js";
import { searchInList } from "@/e2e/Wanqara/harness/helpers/admin/crud-helpers.js";

export async function ensureSubsidiaryConfig(
  page: Page,
  forceBusinessType: string,
  dispatchEnabled: boolean = false,
  ebillingEnabled: boolean | undefined = undefined
): Promise<boolean> {
  const typeOption = page.locator("div[style*='min-width: 90px']")
    .filter({ hasText: new RegExp(forceBusinessType, "i") })
    .first();
  await expect(typeOption).toBeVisible({ timeout: 15000 });

  const isAlreadyTargetType = await typeOption.evaluate((el: Element) => el.classList.contains("tw-border-primary"));

  const dispatchContainer = page.locator("div")
    .filter({ hasText: /^Despacho posterior/ })
    .filter({ has: page.locator(".v-switch") })
    .first();
  const switchInput = dispatchContainer.locator("input[type='checkbox']");
  const isDispatchChecked = await switchInput.isVisible() ? await switchInput.isChecked() : false;

  let needsEbillingChange = false;
  let ebillingSwitchInput: Locator | null = null;
  let ebillingContainer: Locator | null = null;
  if (ebillingEnabled !== undefined) {
    ebillingContainer = page.locator('div')
      .filter({ hasText: /^Activar Facturación Electró/i })
      .filter({ has: page.locator(".v-switch") })
      .first();
    ebillingSwitchInput = ebillingContainer.locator("input[type='checkbox']");
    const isEbillingChecked = await ebillingSwitchInput.isVisible() ? await ebillingSwitchInput.isChecked() : false;
    needsEbillingChange = isEbillingChecked !== ebillingEnabled;
  }

  const needsTypeChange = !isAlreadyTargetType;
  const needsDispatchChange = isDispatchChecked !== dispatchEnabled;

  if (!needsTypeChange && !needsDispatchChange && !needsEbillingChange) {
    return false;
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

  if (needsEbillingChange && ebillingContainer && ebillingSwitchInput) {
    await ebillingContainer.locator(".v-switch").click();
    if (ebillingEnabled) {
      const edocDialog = page.locator('.v-overlay--active').filter({ hasText: /Activar Facturación/i });
      if (await edocDialog.isVisible({ timeout: 2500 }).catch(() => false)) {
        const confirmBtn = edocDialog.getByRole('button', { name: /Confirmar/i });
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
      await expect(ebillingSwitchInput).toBeChecked();
    } else {
      await expect(ebillingSwitchInput).not.toBeChecked();
    }
  }

  const confirmarActivacionBtn = page.getByRole("button", { name: /^Confirmar Activación$/i });
  if (await confirmarActivacionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmarActivacionBtn.click();
  }

  await page.locator('header').getByRole('button', { name: /^Guardar$/i }).click();

  const confirmModal = page.locator(".v-overlay__content").filter({ hasText: /Resumen/i }).first();
  await expect(confirmModal).toBeVisible();
  await confirmModal.locator(".v-checkbox input[type='checkbox']").click();
  await confirmModal.getByRole("button", { name: /Confirmar/i }).click();

  const infoModal = page.locator(".v-overlay__content").filter({ hasText: /cierre esta ventana/i }).first();
  await expect(infoModal).toBeVisible();
  await infoModal.getByRole("button", { name: /Entendido/i }).click();

  return true;
}

export async function navigateToSubsidiaryDetail(page: Page, subsidiaryName: string, subsidiaryCode: string): Promise<void> {
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

export interface EnvSetupFlowOptions {
  authType: string;
  forceBusinessType: string;
  dispatchEnabled: boolean;
  ebillingEnabled?: boolean | undefined;
  subsidiaryName: string;
  subsidiaryCode: string;
}

export async function runEnvSetupFlow(page: Page, { authType, forceBusinessType, dispatchEnabled, ebillingEnabled, subsidiaryName, subsidiaryCode }: EnvSetupFlowOptions): Promise<void> {
  await ensureAuthenticated(page, { targetPath: "/admin/home", authType });

  await navigateToSubsidiaryDetail(page, subsidiaryName, subsidiaryCode);

  const requiresRelogin = await ensureSubsidiaryConfig(page, forceBusinessType, dispatchEnabled, ebillingEnabled);

  if (requiresRelogin) {
    const loginCredentials = playwrightHarness.users[authType as keyof typeof playwrightHarness.users];
    await logoutAndLoginAgain(page, { login: loginCredentials, subsidiaryName, subsidiaryCode });
  }
}
