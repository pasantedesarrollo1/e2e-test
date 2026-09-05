// Contexto de origen: Ticket WS-981, TES-206 (ws-981-helpers.js)
// Función: Validar las restricciones de tipos de documentos al cambiar dinámicamente de sucursal.

import { expect } from "@playwright/test";

export async function readSelectedDocumentType(page) {
  const docLabel = page.locator("main").getByText("Tipo de Documento").first();
  await expect(docLabel).toBeVisible({ timeout: 10000 });
  const docInputWrapper = docLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  const text = await docInputWrapper.innerText();
  return text.replace(/Tipo de Documento|\*/ig, "").replace(/[""']/g, "").trim();
}

export async function getAvailableDocumentOptions(page) {
  const docLabel = page.locator("main").getByText("Tipo de Documento").first();
  const docInputWrapper = docLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  const isLocked = await docInputWrapper.evaluate(el => 
    el.classList.contains('v-input--disabled') || el.classList.contains('v-input--readonly')
  );

  if (isLocked) {
    const singleOption = await readSelectedDocumentType(page);
    return [singleOption];
  }

  const dropdownIcon = docInputWrapper.locator('.v-icon').last();
  await dropdownIcon.click({ force: true });
  
  const activeListbox = page.locator(".v-overlay-container .v-overlay--active").locator("[role='listbox'], .v-list").first();
  
  try {
    await expect(activeListbox).toBeVisible({ timeout: 3000 });
  } catch (e) {
    const singleOption = await readSelectedDocumentType(page);
    return [singleOption];
  }
  
  const options = await activeListbox.locator('.v-list-item').allInnerTexts();
  
  await page.keyboard.press("Escape");
  await expect(activeListbox).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  
  return options.map(opt => opt.replace(/[""']/g, "").trim());
}
