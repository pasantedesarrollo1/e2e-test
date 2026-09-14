import { expect } from "@playwright/test";

export async function openDrawer(page, triggerLocator, filterText) {
  await triggerLocator.click();

  const drawer = page.locator(".v-navigation-drawer").filter({ hasText: filterText }).first();
  await expect(drawer).toBeVisible();

  return drawer;
}

export async function closeDrawer(page, filterText) {
  const drawer = page.locator(".v-navigation-drawer").filter({ hasText: filterText }).first();
  const closeBtn = drawer.locator(".v-btn--icon").filter({ has: page.locator(".mdi-close") }).first();

  await closeBtn.click();

  await expect(drawer).toHaveAttribute("inert", "");
}

export async function navigateToSavedSales(page, drawer) {
  const option = drawer
    .locator("button, .v-btn")
    .filter({ hasText: /Ventas Guardadas/i })
    .first();

  await option.click();

  await page.waitForURL(/\/pos\/saved-sales/);
}

export async function expandAndRecoverFirstSavedSale(page) {
  const recoverBtn = page.getByRole("button", { name: "Recuperar", exact: true }).first();
  await expect(recoverBtn).toBeVisible({ timeout: 10000 });
  await expect(recoverBtn).not.toHaveAttribute("aria-busy", "true");
  await recoverBtn.click();
  await page.waitForURL(/\/pos\/(restaurant-)?home/);
}
