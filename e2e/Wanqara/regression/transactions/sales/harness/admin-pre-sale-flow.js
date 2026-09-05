import { expect } from "@playwright/test";
import { SEED } from "../../../../harness/seed.js";
import { ensureAuthenticated } from "../../../../harness/auth.js";
import { selectClientByCedula } from '../../../../harness/client-helpers.js';

import { selectCheckout as _selectCheckout } from './admin-sale-flow.js';

export const selectCheckout = (page) => _selectCheckout(page, /\/admin\/pre-sale\/add/);

import { selectDocumentType } from './admin-document-helpers.js';
export { selectDocumentType };

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