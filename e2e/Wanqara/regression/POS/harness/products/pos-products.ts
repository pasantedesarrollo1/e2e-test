import { expect, type Page } from "@playwright/test";

export async function selectFirstVariant(page: Page): Promise<void> {
  const tallaColorModal = page.locator(".v-overlay__content").filter({
    hasText: /Variantes encontradas/i,
  }).first();
  await expect(tallaColorModal).toBeVisible();

  const firstAgregarButton = tallaColorModal.getByRole("button", { name: /Agregar/i }).first();
  await firstAgregarButton.click();

  const agregarSeleccionButton = tallaColorModal.getByRole("button", { name: /Agregar Selección/i });
  await agregarSeleccionButton.click();

  await expect(tallaColorModal).toBeHidden();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function selectFirstSerie(page: Page): Promise<void> {
  const seriesModal = page.locator(".v-overlay__content").filter({
    has: page.locator(".tw-font-mono.tw-text-sm"),
  }).first();
  await expect(seriesModal).toBeVisible({ timeout: 30000 });

  const firstSerie = seriesModal.locator(".tw-font-mono.tw-text-sm").first();
  await firstSerie.click();

  const saveButton = seriesModal.getByRole("button", { name: /Guardar/i });
  await saveButton.click();

  await expect(seriesModal).toBeHidden();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}