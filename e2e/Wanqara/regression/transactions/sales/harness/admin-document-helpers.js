import { expect } from "@playwright/test";
import { SEED } from "../../../../harness/seed.js";

export async function selectDocumentType(page, documentType) {
  if (!documentType) return;

  const docLabel = page.locator("main").getByText("Tipo de Documento").first();
  await expect(docLabel).toBeVisible({ timeout: 10000 });

  const docInputWrapper = docLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');

  const normalize = (s) => s.replace(/[""'']/g, '').replace(/\s+/g, ' ').trim();

  const FACTURA_CODES = ["01"];

  const currentText = normalize(await docInputWrapper.innerText());
  const normalizedTarget = normalize(documentType);

  const alreadySelected =
    currentText.includes(normalizedTarget) ||
    (documentType === SEED.documentTypes.facturaElectronica &&
      FACTURA_CODES.some((code) => currentText.includes(code)));

  if (alreadySelected) return;

  const dropdownIcon = docInputWrapper.locator('.v-icon').last();
  await dropdownIcon.click({ force: true });

  const activeListbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
  await expect(activeListbox).toBeVisible({ timeout: 5000 });

  const option = activeListbox.getByRole("option", { name: new RegExp(normalize(documentType), "i") }).first();
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();

  await expect(activeListbox).not.toBeVisible({ timeout: 5000 });
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
  await branchSelect.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible({ timeout: 5000 });
  await listbox.getByRole("option", { name: new RegExp(targetSubsidiary, "i") }).first().click();
  await expect(listbox).not.toBeVisible({ timeout: 5000 });

  await page.keyboard.press("Escape");
  await expect(profileModal).not.toBeVisible({ timeout: 5000 });

  await page.waitForLoadState("networkidle");
  await expect(
    page.locator("header").first().locator("button").filter({ hasText: new RegExp(shortName, "i") }).first()
  ).toBeVisible({ timeout: 15000 });
}

