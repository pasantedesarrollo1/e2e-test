import { expect } from "@playwright/test";
import { SEED } from "../../../../harness/config/seed.js";
import { selectDropdownOption } from "../../../../harness/helpers/ui-helpers.js";

export async function selectDocumentType(page, documentType) {
  if (!documentType) return;

  const docLabel = page.locator("main").getByText("Tipo de Documento").first();
  await expect(docLabel).toBeVisible({ timeout: 10000 });

  const docInputWrapper = docLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');

  // Defensivo: Reemplaza tildes y caracteres mal codificados () con el wildcard '.' de regex
  const normalize = (s) => s.replace(/[""'']/g, '').replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.').replace(/\s+/g, ' ').trim();

  const FACTURA_CODES = ["01"];

  const currentText = normalize(await docInputWrapper.innerText());
  const normalizedTarget = normalize(documentType);

  const alreadySelected =
    currentText.includes(normalizedTarget) ||
    (documentType === SEED.documentTypes.facturaElectronica &&
      FACTURA_CODES.some((code) => currentText.includes(code)));

  if (alreadySelected) return;

  const dropdownIcon = docInputWrapper.locator('.v-icon').last();
  
  await selectDropdownOption(page, {
    triggerLocator: dropdownIcon,
    optionText: normalize(documentType)
  });

  // Cierra cualquier overlay que haya quedado residual
  await page.keyboard.press("Escape");
}

export async function switchAdminSubsidiary(page, targetSubsidiary) {
  const shortName = targetSubsidiary.split("-").pop().trim();

  const headerText = await page.locator("header").first().innerText();
  if (headerText.includes(shortName)) {
    return; 
  }

  const profileBtn = page.locator("header").first().locator("button").filter({ hasText: /Wanqara/i }).first();
  await profileBtn.click();

  const profileModal = page.locator(".v-overlay__content").filter({ hasText: /Mi Perfil/i }).first();
  await expect(profileModal).toBeVisible({ timeout: 5000 });

  const branchSelect = profileModal.locator(".v-select").first();
  
  await selectDropdownOption(page, {
    triggerLocator: branchSelect,
    optionText: targetSubsidiary
  });

  await page.keyboard.press("Escape");
  await expect(profileModal).not.toBeVisible({ timeout: 5000 });

  await page.waitForLoadState("networkidle");
  await expect(
    page.locator("header").first().locator("button").filter({ hasText: new RegExp(shortName, "i") }).first()
  ).toBeVisible({ timeout: 15000 });
}

