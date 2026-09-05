import { expect } from "@playwright/test";
import { SEED } from "../../../harness/seed.js";

export async function applyGeneralDiscount(page, rate = SEED.discount.rate) {
  const discountBtn = page.getByRole("button", { name: /Descuento General/i }).first();
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Descuento/i }).first();

  await discountBtn.click({ force: true });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  const input = dialog.locator("input").first();
  await input.fill(String(rate));

  const assignBtn = dialog.getByRole("button", { name: /Asignar descuento/i });
  await assignBtn.click({ force: true });
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
}

export async function applyManualSurcharge(page, rate = SEED.surcharge.rate) {
  const optionsBtn = page.getByRole("button", { name: /Más opciones de porcentaje/i }).first();
  await optionsBtn.click();

  const chargeOption = page.getByRole("listitem").filter({ hasText: /Aplicar Recargo/i }).first();
  await expect(chargeOption).toBeVisible({ timeout: 5000 });
  await chargeOption.click();

  const input = page.getByPlaceholder(/Ingresa un Recargo/i).first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(String(rate));

  const assignBtn = page.getByRole("button", { name: /Asignar recargo/i });
  await expect(assignBtn).toBeVisible({ timeout: 5000 });

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/pos") && res.request().method() === "POST",
      { timeout: 10000 }
    ).catch(() => {}),
    assignBtn.click({ force: true }),
  ]);

  await expect(input).not.toBeVisible({ timeout: 5000 });
}