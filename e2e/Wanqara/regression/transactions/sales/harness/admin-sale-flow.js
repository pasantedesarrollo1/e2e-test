import { expect } from "@playwright/test";
import { SEED } from "../../../../harness/seed.js";
import { ensureAuthenticated } from "../../../../harness/auth.js";
import { selectClientByCedula } from '../../../../harness/client-helpers.js';

async function assignManualBodega(page) {
  const bodegaLabel = page.locator("main").getByText("Bodega").first();
  const bodegaWrapper = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await expect(async () => {
    const dropdownIcon = bodegaWrapper.locator('.v-icon').last();
    await dropdownIcon.click({ force: true });
    
    const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
    await expect(listbox).toBeVisible({ timeout: 2000 });
    
    const targetOption = listbox.getByRole("option", { name: new RegExp(SEED.pos.warehouse, "i") }).first();
    if (await targetOption.isVisible()) {
      await targetOption.click();
    } else {
      await listbox.getByRole("option").first().click();
    }
    
    await expect(listbox).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

async function assignManualCaja(page) {
  const cajaLabel = page.locator("main").getByText("Punto de Venta").first();
  const cajaWrapper = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await expect(async () => {
    const dropdownIcon = cajaWrapper.locator('.v-icon').last();
    await dropdownIcon.click({ force: true });
    
    const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
    await expect(listbox).toBeVisible({ timeout: 2000 });
    
    await listbox.getByRole("option").first().click();
    await expect(listbox).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

export async function selectCheckout(page, urlPattern = /\/admin\/ventas\/add/) {
  await page.waitForURL(urlPattern);
  await page.waitForTimeout(1000);

  // 1. Asignar Bodega solo si está vacía
  const bodegaLabel = page.locator("main").getByText("Bodega").first();
  if (await bodegaLabel.isVisible()) {
    const bodegaWrapper = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
    const text = await bodegaWrapper.innerText();
    const cleanText = text.replace(/Bodega|\*/ig, "").trim();
    
    if (cleanText.length === 0) {
      await assignManualBodega(page);
    }
  }

  // 2. Asignar Caja solo si está vacía
  const cajaLabel = page.locator("main").getByText("Punto de Venta").first();
  await expect(cajaLabel).toBeVisible({ timeout: 10000 });
  
  const cajaWrapper = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  const cajaText = await cajaWrapper.innerText();
  const cleanCajaText = cajaText.replace(/Punto de Venta|Caja|\*/ig, "").trim();
  
  if (cleanCajaText.length === 0) {
    // FIX: Eliminada la llamada redundante a assignManualBodega(page)
    await assignManualCaja(page);
  }

  // 3. Limpiar estado visual de forma segura
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

import { selectDocumentType } from './admin-document-helpers.js';
export { selectDocumentType };

export { selectClientByCedula } from '../../../../harness/client-helpers.js';

export async function searchAndSelectProduct(page, { name, searchTerm }) {
  const term = searchTerm || name;

  const profileOverlay = page.locator(".v-overlay--active").filter({ hasText: /Cerrar Sesión/i });
  if (await profileOverlay.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(profileOverlay).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  }

  const searchInput = page.locator("#searchInput").first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  
  await searchInput.click();
  await searchInput.clear();
  await page.waitForTimeout(300); 

  await searchInput.pressSequentially(term, { delay: 30 });
  await page.waitForTimeout(1000);

  const productItem = page.getByText(name, { exact: false }).first();
  await expect(productItem).toBeVisible({ timeout: 20000 });
  await productItem.click({ force: true });
}

export { applyGeneralDiscount, applyManualSurcharge } from '../../harness/admin-modifier-helpers.js';

export async function selectPaymentMethod(page, methodName = SEED.paymentMethods.efectivo.label) {
  const methodItem = page.getByText(methodName, { exact: true }).first();
  await methodItem.scrollIntoViewIfNeeded();
  await methodItem.click({ force: true });
}

export async function submitAdminSale(page) {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true }).first();

  await expect(saveBtn).toBeVisible({ timeout: 10000 });
  await expect(saveBtn).toBeEnabled({ timeout: 15000 });

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v2/billing/sales") && res.request().method() === "POST",
      { timeout: 30000 }
    ),
    saveBtn.click({ force: true }),
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Venta guardada/i }).first()
  ).toBeVisible({ timeout: 15000 });
}

export async function runAdminSaleFlow(page, {
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
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/ventas/add", authType });
    await page.waitForURL(/\/admin\/ventas\/add/);
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
  await submitAdminSale(page);
}