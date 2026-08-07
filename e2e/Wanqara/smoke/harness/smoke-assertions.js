import { expect } from "@playwright/test";

export async function assertPageTitle(page, title) {
  await expect(
    page.locator(".v-toolbar-title").filter({ hasText: title }).first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertAdminHomeWelcome(page) {
  await expect(
    page.getByText("Bienvenido ¡Tu crecimiento comienza aquí!"),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertProductCardsVisible(page) {
  await expect(
    page.locator(".custom-card").first(),
  ).toBeVisible({ timeout: 45000 });
}

export async function assertTableHasRows(page) {
  await expect(
    page.locator(".v-data-table__tr").first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertTextVisible(page, text) {
  await expect(
    page.getByText(new RegExp(`^\\s*${text}\\s*$`)).first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertTextContains(page, text) {
  await expect(
    page.getByText(text, { exact: false }).first(),
  ).toBeVisible({ timeout: 15000 });
}

export async function assertMainContains(page, text) {
  await expect(
    page.locator("main").getByText(text, { exact: false }).first(),
  ).toBeVisible({ timeout: 15000 });
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function assertAnyTextVisible(page, texts) {
  await expect(
    page.getByText(new RegExp(texts.map(escapeRegExp).join("|"))).first(),
  ).toBeVisible({ timeout: 15000 });
}