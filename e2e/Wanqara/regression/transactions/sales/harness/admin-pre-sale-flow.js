import { expect } from "@playwright/test";
import { SEED } from "../../../../harness/seed.js";
import { ensureAuthenticated } from "../../../../harness/auth.js";
import { selectClientByCedula } from '../../../../harness/client-helpers.js';

import { selectCheckout as _selectCheckout } from './admin-sale-flow.js';

export const selectCheckout = (page) => _selectCheckout(page, /\/admin\/pre-sale\/add/);

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

export { selectClientByCedula } from '../../../../harness/client-helpers.js';

import { searchAndSelectProduct } from './admin-sale-flow.js';
export { searchAndSelectProduct };

export { applyGeneralDiscount, applyManualSurcharge } from '../../harness/admin-modifier-helpers.js';

export async function selectPaymentMethod(page, methodName = SEED.paymentMethods.efectivo.label) {
  const methodItem = page.getByText(methodName, { exact: true }).first();
  await methodItem.scrollIntoViewIfNeeded();
  await methodItem.click({ force: true });
}

export async function submitAdminPreSale(page) {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true }).first();

  await expect(saveBtn).toBeVisible({ timeout: 10000 });
  await expect(saveBtn).toBeEnabled({ timeout: 15000 });

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v2/billing/pre-sales") && res.request().method() === "POST",
      { timeout: 30000 }
    ),
    saveBtn.click({ force: true }),
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /guardada|correctamente/i }).first()
  ).toBeVisible({ timeout: 15000 });
}

export async function runAdminPreSaleFlow(page, {
  tenantBaseUrl,
  authType,
  documentType,
  clientCedula = SEED.clients.consumidorFinal.cedula,
  productName,
  searchTerm,
  beforeFinish,
  paymentMethod = SEED.paymentMethods.efectivo.label,
  skipNavigation = false,
}) {
  if (!skipNavigation) {
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/pre-sale/add", authType });
    await page.waitForURL(/\/admin\/pre-sale\/add/);
  }

  await selectCheckout(page);
  await selectDocumentType(page, documentType);
  await selectClientByCedula(page, clientCedula);

  if (productName) {
    await searchAndSelectProduct(page, { name: productName, searchTerm });
  }

  if (beforeFinish) {
    await beforeFinish(page);
  }

  await selectPaymentMethod(page, paymentMethod);
  await submitAdminPreSale(page);
}