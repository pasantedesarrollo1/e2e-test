import { expect } from "@playwright/test";
import { withPath } from "./urls.js";
import { SEED } from "./seed.js";

export async function ensureRetailBusinessType(page, { tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, `/admin/subsidiaries/detail/${SEED.subsidiary.id}`));
  await expect(page).not.toHaveURL(/\/login(\/|$)/);

  const retailOption = page
    .locator("div[style*='min-width: 90px']")
    .filter({ hasText: /^Comercios$/i })
    .first();

  await expect(retailOption).toBeVisible();

  const isAlreadyRetail = await retailOption.evaluate((el) =>
    el.classList.contains("tw-border-primary"),
  );

  if (isAlreadyRetail) {
    return false;
  }

  const editButton = page.getByRole("button", { name: /^Editar$/i });
  await expect(editButton).toBeVisible();
  await editButton.click();

  await expect(retailOption).toBeVisible();
  await retailOption.click();
  await expect(retailOption).toHaveClass(/tw-border-primary/);

  const saveButton = page.getByRole("button", { name: /^Guardar$/i });
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  const confirmModal = page.locator(".v-overlay__content").filter({ hasText: /Resumen/i }).first();
  await expect(confirmModal).toBeVisible();

  const acceptCheckbox = confirmModal.locator(".v-checkbox input[type='checkbox']");
  await expect(acceptCheckbox).toBeVisible();
  await acceptCheckbox.click();
  await expect(acceptCheckbox).toBeChecked();

  const confirmButton = confirmModal.getByRole("button", { name: /Confirmar y actualizar/i });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  const infoModal = page.locator(".v-overlay__content").filter({ hasText: /cierre esta ventana/i }).first();
  await expect(infoModal).toBeVisible();

  const entendidoButton = infoModal.getByRole("button", { name: /Entendido/i });
  await expect(entendidoButton).toBeVisible();
  await entendidoButton.click();

  await expect(infoModal).not.toBeVisible();

  return true;
}