import { expect } from "@playwright/test";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from '../../../../harness/helpers/people/client-helpers.js';

import { selectCheckout as _selectCheckout } from './admin-checkout-helpers.js';

export const selectCheckout = (page, options = {}) => _selectCheckout(page, { urlPattern: /\/admin\/pre-sale\/add/, ...options });

import { selectDocumentType } from './admin-document-helpers.js';
export { selectDocumentType };

  export { selectClientByCedula } from '../../../../harness/helpers/people/client-helpers.js';

import { searchAndSelectProduct } from './admin-checkout-helpers.js';
export { searchAndSelectProduct };

  export { applyGeneralDiscount, applyManualSurcharge } from '../../harness/admin-modifier-helpers.js';

export async function selectPaymentMethod(page, methodName) {
  if (!methodName) throw new Error("selectPaymentMethod requires a methodName parameter.");
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
  clientCedula,
  productName,
  searchTerm,
  beforeFinish,
  paymentMethod,
  warehouseName,
  skipNavigation = false,
}) {
  if (!skipNavigation) {
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/pre-sale/add", authType });
    await page.waitForURL(/\/admin\/pre-sale\/add/);
  }

  await selectCheckout(page, { warehouseName });
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
