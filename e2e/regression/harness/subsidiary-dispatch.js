import { expect } from "@playwright/test";
import { SEED } from "../../harness/seed.js";
import { withPath } from "../../harness/urls.js";

export async function setDispatchInventory(page, { tenantBaseUrl, enable }) {
  await page.goto(withPath(tenantBaseUrl, `/admin/subsidiaries/detail/${SEED.subsidiary.id}`));
  await expect(page).not.toHaveURL(/\/login(\/|$)/);

  const editButton = page.getByRole("button", { name: /^Editar$/i });
  const saveButton = page.getByRole("button", { name: /^Guardar$/i });

  const isAlreadyEditing = await saveButton.isVisible();
  if (!isAlreadyEditing) {
    await editButton.click();
  }

  const comerciosOption = page.getByText("Comercios", { exact: true }).first();
  await comerciosOption.click();

  const dispatchContainer = page.locator("div").filter({
    hasText: /^Despacho posterior/,
  }).filter({
    has: page.locator(".v-switch"),
  }).first();

  const switchInput = dispatchContainer.locator("input[type='checkbox']");
  const isChecked = await switchInput.isChecked();

  if (enable && !isChecked) {
    await dispatchContainer.locator(".v-switch").click();
    await expect(switchInput).toBeChecked();
  } else if (!enable && isChecked) {
    await dispatchContainer.locator(".v-switch").click();
    await expect(switchInput).not.toBeChecked();
  } else {
    // Si no hubo cambios en el switch, retornamos false
    return false; 
  }

  await saveButton.click();

  const confirmModal = page.locator(".v-overlay__content").filter({ hasText: /Resumen/i }).first();
  
  const acceptCheckbox = confirmModal.locator(".v-checkbox input[type='checkbox']");
  const isAlreadyChecked = await acceptCheckbox.isChecked();
  if (!isAlreadyChecked) {
    await confirmModal.locator(".v-checkbox").first().click();
  }
  await expect(acceptCheckbox).toBeChecked();

  const confirmButton = confirmModal.getByRole("button", { name: /Confirmar|Actualizar/i });
  await confirmButton.click();

  const infoModal = page.locator(".v-overlay__content").filter({ hasText: /cierre esta ventana/i }).first();
  
  const entendidoButton = infoModal.getByRole("button", { name: /Entendido/i });
  await entendidoButton.click();

  await expect(infoModal).not.toBeVisible();
  
  return true;
}