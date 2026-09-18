import { expect, type Page, type Locator } from "@playwright/test";

export async function openDrawer(page: Page, triggerLocator: Locator, filterText: string | RegExp): Promise<Locator> {
  await triggerLocator.click();

  const drawer = page.locator(".v-navigation-drawer").filter({ hasText: filterText }).first();
  await expect(drawer).toBeVisible();

  return drawer;
}

export async function closeDrawer(page: Page, filterText: string | RegExp): Promise<void> {
  const drawer = page.locator(".v-navigation-drawer").filter({ hasText: filterText }).first();
  const closeBtn = drawer.locator(".v-btn--icon").filter({ has: page.locator(".mdi-close") }).first();

  await closeBtn.click();

  await expect(drawer).toHaveAttribute("inert", "");
}

export async function navigateToSavedSales(page: Page, drawer: Locator): Promise<void> {
  const option = drawer
    .locator("button, .v-btn")
    .filter({ hasText: /Ventas Guardadas/i })
    .first();

  await option.click();

  await page.waitForURL(/\/pos\/saved-sales/);
}

export async function expandAndRecoverFirstSavedSale(page: Page): Promise<void> {
  const recoverBtn = page.getByRole("button", { name: "Recuperar", exact: true }).first();
  await expect(recoverBtn).toBeVisible({ timeout: 10000 });
  await expect(recoverBtn).not.toHaveAttribute("aria-busy", "true");
  await recoverBtn.click();
  await page.waitForURL(/\/pos\/(restaurant-)?home/);
}
