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

export async function switchAdminSubsidiary(page, targetSubsidiaryMatch) {
  const profileMenuBtn = page.locator('header button').filter({ hasText: /QA developer|Wanqara/i }).first();
  await profileMenuBtn.click();
  
  const profileMenu = page.locator(".v-overlay-container .v-overlay--active").filter({ hasText: /Cerrar Sesión/i }).first();
  await expect(profileMenu).toBeVisible({ timeout: 5000 });
  
  const branchComboboxField = profileMenu.locator('.v-select .v-field').first();
  
  await expect(async () => {
    await branchComboboxField.click();
    const activeListbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").last();
    await expect(activeListbox).toBeVisible({ timeout: 2000 });
    const targetOption = activeListbox.getByRole("option", { name: new RegExp(targetSubsidiaryMatch, "i") }).first();
    await targetOption.click();
    
    await expect(activeListbox).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  
  if (await profileMenu.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(profileMenu).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  }
  
  await page.waitForTimeout(2000); 
}