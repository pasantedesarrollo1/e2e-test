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
  await expect(async () => {
    const cajaCombobox = page.getByRole("combobox", { name: /Caja/i }).first();
    await cajaCombobox.click({ force: true });
    
    const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
    await expect(listbox).toBeVisible({ timeout: 2000 });
    
    await listbox.getByRole("option").first().click();
    await expect(listbox).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

export async function selectCheckout(page) {
  await page.waitForURL(/\/admin\/ventas\/add/);
  await page.waitForTimeout(1000);

  const bodegaLabel = page.locator("main").getByText("Bodega").first();
  if (await bodegaLabel.isVisible()) {
    const bodegaWrapper = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
    const text = await bodegaWrapper.innerText();
    const cleanText = text.replace(/Bodega|\*/ig, "").trim();
    
    if (cleanText.length === 0) {
      await assignManualBodega(page);
    }
  }

  const cajaLabel = page.locator("main").getByText("Punto de Venta").first();
  await expect(cajaLabel).toBeVisible({ timeout: 10000 });
  
  const cajaWrapper = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  const cajaText = await cajaWrapper.innerText();
  const cleanCajaText = cajaText.replace(/Punto de Venta|Caja|\*/ig, "").trim();
  
  if (cleanCajaText.length === 0) {
    await assignManualCaja(page);
  }

  await page.locator("main").click({ position: { x: 10, y: 10 }, force: true });
  await page.waitForTimeout(200);
}

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

export async function applyGeneralDiscount(page, rate = SEED.discount.rate) {
  const discountBtn = page.getByRole("button", { name: /Descuento General/i }).first();
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Descuento/i }).first();

  await discountBtn.click({ force: true });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  const input = dialog.locator("input").first();
  await input.fill(String(rate));

  const assignBtn = dialog.getByRole("button", { name: /Asignar descuento/i });
  await assignBtn.click({ force: true });
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
}

export async function applyManualSurcharge(page, rate = SEED.surcharge.rate) {
  const optionsBtn = page.getByRole("button", { name: /Más opciones de porcentaje/i }).first();
  await optionsBtn.click();

  const chargeOption = page.getByRole("listitem").filter({ hasText: /Aplicar Recargo/i }).first();
  await expect(chargeOption).toBeVisible({ timeout: 5000 });
  await chargeOption.click();

  const input = page.getByPlaceholder(/Ingresa un Recargo/i).first();
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(String(rate));

  const assignBtn = page.getByRole("button", { name: /Asignar recargo/i });
  await expect(assignBtn).toBeVisible({ timeout: 5000 });

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/pos") && res.request().method() === "POST",
      { timeout: 10000 }
    ).catch(() => {}),
    assignBtn.click({ force: true }),
  ]);

  await expect(input).not.toBeVisible({ timeout: 5000 });
}

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