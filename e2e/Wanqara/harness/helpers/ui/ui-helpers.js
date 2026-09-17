import { expect } from "@playwright/test";

export function formatPosSubsidiary(name, code) {
  if (!code) return name;
  return `${name} ${code}`;
}

export function formatChefSubsidiary(name, code) {
  if (!code) return name;
  return `${code} - ${name}`;
}

export async function selectDropdownOption(page, {
  triggerLocator,
  optionText = null,
  timeout = 3000,
  retryTimeout = 5000
}) {
  await triggerLocator.scrollIntoViewIfNeeded();
  await triggerLocator.click({ delay: 100 });

  const activeOverlay = page.locator(".v-overlay-container .v-overlay--active").last();
  
  const option = optionText
    ? activeOverlay.locator('[role="option"]').filter({ hasText: new RegExp(optionText, "i") }).first()
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

export async function expectSnackbar(page, messageRegex, timeout = 15000) {
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

export async function clickAndWaitForApi(page, locator, { endpoint, method = 'POST', status = 200 }) {
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
