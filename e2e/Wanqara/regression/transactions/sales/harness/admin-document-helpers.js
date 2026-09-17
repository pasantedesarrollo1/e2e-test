import { expect } from "@playwright/test";
import { selectDropdownOption } from "../../../../harness/helpers/ui/ui-helpers.js";

export async function selectDocumentType(page, documentType) {
  if (!documentType) return;

  const docLabel = page.locator("main").getByText("Tipo de Documento").first();
  await expect(docLabel).toBeVisible({ timeout: 10000 });

  const docInputWrapper = docLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');

  const normalize = (s) => s.replace(/[""'']/g, '').replace(/[áéíóúÁÉÍÓÚñÑ]/g, '.').replace(/\s+/g, ' ').trim();

  const FACTURA_CODES = ["01"];

  const currentText = normalize(await docInputWrapper.innerText());
  const normalizedTarget = normalize(documentType);

  const alreadySelected =
    currentText.includes(normalizedTarget) ||
    (documentType === "Factura electrónica" &&
      FACTURA_CODES.some((code) => currentText.includes(code)));

  if (alreadySelected) return;

  const dropdownIcon = docInputWrapper.locator('.v-icon').last();
  
  await selectDropdownOption(page, {
    triggerLocator: dropdownIcon,
    optionText: normalize(documentType)
  });

  await page.keyboard.press("Escape");
}

