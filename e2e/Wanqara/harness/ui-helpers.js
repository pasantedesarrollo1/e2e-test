import { expect } from "@playwright/test";

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

  await page.waitForTimeout(300);
  await option.click();
  
  await expect(option).not.toBeVisible({ timeout: 5000 });
}

export async function expectSnackbar(page, messageRegex, timeout = 15000) {
  const snackbar = messageRegex
    ? page.locator(".v-snackbar").filter({ hasText: messageRegex }).first()
    : page.locator(".v-snackbar").first();
    
  await expect(snackbar).toBeVisible({ timeout });
}