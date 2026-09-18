import { expect, type Page, type Locator, type Response } from "@playwright/test";

/**
 * Formats the POS subsidiary name and code.
 */
export function formatPosSubsidiary(name: string, code?: string | null): string {
  if (!code) return name;
  return `${name} ${code}`;
}

/**
 * Formats the Chef subsidiary name and code.
 */
export function formatChefSubsidiary(name: string, code?: string | null): string {
  if (!code) return name;
  return `${code} - ${name}`;
}

export interface SelectDropdownOptions {
  triggerLocator: Locator;
  optionText?: string | RegExp | null;
  timeout?: number;
  retryTimeout?: number;
}

/**
 * Clicks a dropdown trigger and selects an option from the Vuetify overlay.
 */
export async function selectDropdownOption(page: Page, {
  triggerLocator,
  optionText = null,
  timeout = 3000,
  retryTimeout = 5000
}: SelectDropdownOptions): Promise<void> {
  await triggerLocator.scrollIntoViewIfNeeded();
  await triggerLocator.click({ delay: 100 });

  const activeOverlay = page.locator(".v-overlay-container .v-overlay--active").last();
  
  const option = optionText
    ? activeOverlay.locator('[role="option"]').filter({ hasText: typeof optionText === 'string' ? new RegExp(optionText, "i") : optionText }).first()
    : activeOverlay.locator('[role="option"]').first();

  try {
    await option.waitFor({ state: "visible", timeout });
  } catch {
    await triggerLocator.click({ force: true, delay: 100 });
    await option.waitFor({ state: "visible", timeout: retryTimeout });
  }

  await option.click();
  
  await expect(option).not.toBeVisible({ timeout: 5000 });
}

/**
 * Waits for a Vuetify snackbar matching a message and optionally closes it.
 */
export async function expectSnackbar(page: Page, messageRegex?: RegExp | string | null, timeout: number = 15000): Promise<void> {
  const snackbar = messageRegex
    ? page.locator(".v-snackbar").filter({ hasText: messageRegex }).last()
    : page.locator(".v-snackbar").last();
    
  await expect(snackbar).toBeVisible({ timeout });
  
  const closeBtn = snackbar.locator('.v-btn.v-btn--flat.v-btn--icon.v-btn--slim').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
    await expect(snackbar).toBeHidden({ timeout: 5000 }).catch(() => {});
  }
}

export interface ApiWaitOptions {
  endpoint: string | RegExp;
  method?: string;
  status?: number | number[];
}

/**
 * Clicks a locator and waits for a specific API response.
 */
export async function clickAndWaitForApi(page: Page, locator: Locator, { endpoint, method = 'POST', status = 200 }: ApiWaitOptions): Promise<Response> {
  const [response] = await Promise.all([
    page.waitForResponse(res => {
      const urlMatches = typeof endpoint === 'string' ? res.url().includes(endpoint) : endpoint.test(res.url());
      const statusMatches = Array.isArray(status) ? status.includes(res.status()) : res.status() === status;
      return urlMatches && res.request().method() === method && statusMatches;
    }),
    locator.click({ force: true })
  ]);
  return response;
}
