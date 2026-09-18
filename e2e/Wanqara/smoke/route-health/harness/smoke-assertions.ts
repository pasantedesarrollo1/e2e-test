 
import { expect, type Page } from "@playwright/test";

export async function assertPageTitle(page: Page, title: string | RegExp) {
  await expect(
    page.locator(".v-toolbar-title").filter({ hasText: title }).first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertAdminHomeWelcome(page: Page) {
  await expect(
    page.getByText("Bienvenido ¡Tu crecimiento comienza aquí!"),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertProductCardsVisible(page: Page) {
  await expect(
    page.locator(".custom-card").first(),
  ).toBeVisible({ timeout: 45000 });
}

export async function assertTableHasRows(page: Page) {
  await expect(
    page.locator(".v-data-table__tr").first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertTextVisible(page: Page, text: string) {
  await expect(
    page.getByText(new RegExp(`^\\s*${text}\\s*$`)).first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertTextContains(page: Page, text: string) {
  await expect(
    page.getByText(text, { exact: false }).first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertMainContains(page: Page, text: string) {
  await expect(
    page.locator("main").getByText(text, { exact: false }).first(),
  ).toBeVisible({ timeout: 15000 });
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function assertAnyTextVisible(page: Page, texts: string[]) {
  await expect(
    page.getByText(new RegExp(texts.map(escapeRegExp).join("|"))).first(),
  ).toBeVisible({ timeout: 15000 });
}