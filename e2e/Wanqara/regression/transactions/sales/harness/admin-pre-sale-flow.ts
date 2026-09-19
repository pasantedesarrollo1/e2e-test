/* eslint-disable */
import { expect, type Page } from "@playwright/test";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { selectClientByCedula } from '@/e2e/Wanqara/harness/helpers/shared/client-picker.js';

import { selectCheckout as _selectCheckout } from './admin-checkout-helpers.js';

import type { SelectCheckoutOptions } from "./admin-checkout-helpers.js";
export const selectCheckout = (page: Page, options: SelectCheckoutOptions = {}) => _selectCheckout(page, { urlPattern: /\/admin\/pre-sale\/add/, ...options });

import { selectDocumentType } from './admin-document-helpers.js';
export { selectDocumentType };

  export { selectClientByCedula } from '@/e2e/Wanqara/harness/helpers/shared/client-picker.js';

import { searchAndSelectProduct } from './admin-checkout-helpers.js';
export { searchAndSelectProduct };

  // @ts-ignore
  export { applyGeneralDiscount, applyManualSurcharge } from '@/e2e/Wanqara/regression/transactions/harness/admin-modifier-helpers.js';

export async function selectPaymentMethod(page: Page, methodName: string): Promise<void> {
  if (!methodName) throw new Error("selectPaymentMethod requires a methodName parameter.");
  const methodItem = page.getByText(methodName, { exact: true }).first();
  await methodItem.scrollIntoViewIfNeeded();
  await methodItem.click({ force: true });
}

export async function submitAdminPreSale(page: Page): Promise<void> {
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

export interface AdminPreSaleFlowOptions {
  authType: string;
  documentType?: string;
  clientCedula?: string;
  identityType?: string;
  productName?: string;
  searchTerm?: string | null;
  beforeFinish?: (page: Page) => Promise<void>;
  paymentMethod: string;
  warehouseName?: string;
  skipNavigation?: boolean;
}

export async function runAdminPreSaleFlow(page: Page, {
  authType,
  documentType,
  clientCedula,
  productName,
  searchTerm,
  beforeFinish,
  paymentMethod,
  warehouseName,
  skipNavigation = false
}: AdminPreSaleFlowOptions): Promise<void> {
  if (!skipNavigation) {
    await ensureAuthenticated(page, { targetPath: "/admin/pre-sale/add", authType });
    await page.waitForURL(/\/admin\/pre-sale\/add/);
  }

  await selectCheckout(page, { warehouseName });
  await selectDocumentType(page, documentType);
  await selectClientByCedula(page, clientCedula as string);

  if (productName) {
    await searchAndSelectProduct(page, { name: productName, searchTerm });
  }

  if (beforeFinish) {
    await beforeFinish(page);
  }

  await selectPaymentMethod(page, paymentMethod);
  await submitAdminPreSale(page);
}
