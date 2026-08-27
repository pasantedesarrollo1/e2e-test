import { expect } from "@playwright/test";
import { SEED, getElectronicInvoicingAuthType } from "../../../../../harness/seed.js";
import { ensureAuthenticated } from "../../../../../harness/auth.js";

export const CARRIER_CASES = [
  { label: "por cédula",                 carrier: "cedula"   },
  { label: "por selector",               carrier: "selector" },
  { label: "por formulario de empleado", carrier: "form"     },
];

async function fillInput(page, placeholder, value) {
  const input = page.getByPlaceholder(placeholder).first();
  await input.fill(value);
  await input.press("Tab");
}

export async function assignCarrier(page, carrier) {
  if (carrier === "cedula") {
    await searchCarrierByCedula(page, SEED.clients.carrier.cedula);
    await verifyAndSaveCarrierModal(page, {
      expectedIdentityType: SEED.clients.carrier.identityType,
      expectedIdentity:     SEED.clients.carrier.identity,
      expectedName:         SEED.clients.carrier.name,
    });
    return;
  }

  if (carrier === "selector") {
    await openCarrierSelectorAndSelect(page, SEED.clients.carrier.cedula);
    return;
  }

  await addCarrierViaEmployeeForm(page, {
    identityType: SEED.clients.carrier.identityType,
    identity:     SEED.clients.carrier.identity,
    expectedName: SEED.clients.carrier.name,
  });
}

export async function openAddWaybillDialog(page, { tenantBaseUrl }) {
  const authType = getElectronicInvoicingAuthType();
  await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/waybills/list", authType });
  await expect(page).toHaveURL(/\/admin\/waybills\/list/);

  const addBtn = page.getByRole("button", { name: /Agregar Guía/i }).first();
  await addBtn.click();

  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Nueva guía de remisión/i }).first();
  await expect(dialog).toBeVisible();

  return dialog;
}

export async function selectWaybillTypeAndContinue(page, dialog, type = "internal") {
  await dialog.locator("div[role='radiogroup'] .v-card")
    .filter({ hasText: type === "internal" ? /Interna/i : /Externa/i })
    .first()
    .click();

  const continueBtn = dialog.getByRole("button", { name: /Continuar/i });
  await continueBtn.click();

  await page.waitForURL(/\/admin\/waybills\/add/);
}

export async function fillWaybillDates(page, { startDate, finishDate }) {
  const fmt = (d) => {
    if (typeof d === "string") return d;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const startStr  = fmt(startDate);
  const finishStr = fmt(finishDate);

  const startInput = page.locator("div").filter({ hasText: /^Fecha de inicio/ }).locator("input").first();
  await startInput.clear();
  await startInput.fill(startStr);
  await startInput.press("Tab");

  const finishInput = page.locator("div").filter({ hasText: /^Fecha de finalización/ }).locator("input").first();
  await finishInput.clear();
  await finishInput.fill(finishStr);
  await finishInput.press("Tab");
}

export async function selectWarehouse(page, warehouseName) {
  const warehouseAutocomplete = page.getByRole("combobox", { name: "Seleccione una bodega" });
  await warehouseAutocomplete.scrollIntoViewIfNeeded();
  await warehouseAutocomplete.click({ delay: 100 });

  const option = page.locator(".v-list-item").filter({ hasText: warehouseName }).first();
  
  try {
    await option.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    await warehouseAutocomplete.click({ force: true, delay: 100 });
    await option.waitFor({ state: "visible", timeout: 5000 });
  }
  
  await option.click();
  await expect(option).not.toBeVisible();
}

export async function selectCheckout(page, checkoutName) {
  const checkoutAutocomplete = page.getByRole("combobox", { name: "Seleccione un Punto de Venta" });
  await checkoutAutocomplete.scrollIntoViewIfNeeded();
  await checkoutAutocomplete.click({ delay: 100 });

  const option = page.locator(".v-list-item").filter({ hasText: checkoutName }).first();
  
  try {
    await option.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    await checkoutAutocomplete.click({ force: true, delay: 100 });
    await option.waitFor({ state: "visible", timeout: 5000 });
  }
  
  await option.click();
  await expect(option).not.toBeVisible();
}

export async function fillVehiclePlate(page, plate) {
  await fillInput(page, "Ingrese la placa del vehiculo", plate);
}

export async function searchCarrierByCedula(page, cedula) {
  const carrierInput = page.getByPlaceholder("Ingresa Cédula o RUC").first();
  await carrierInput.fill(cedula);

  const carrierField = page.locator(".v-text-field").filter({ has: carrierInput }).first();
  const searchBtn = carrierField.locator("button").last();
  await searchBtn.click();
}

export async function verifyAndSaveCarrierModal(page, {
  expectedIdentityType,
  expectedIdentity,
  expectedName,
}) {
  const dialog = page.locator(".v-dialog").filter({ hasText: /Agregar Empleado/i }).first();

  await expect(dialog.locator(".v-select").filter({ hasText: expectedIdentityType }).first()).toBeVisible();
  await expect(dialog.locator("#employee-identity-input")).toHaveValue(expectedIdentity);

  const nameInput = dialog.locator(".v-card-text input").filter({ hasValue: expectedName }).first();
  await expect(nameInput).toBeVisible();

  const saveBtn = dialog.getByRole("button", { name: /Guardar Empleado/i });
  await saveBtn.click();

  await expect(dialog).not.toBeVisible();
}

export async function fillInternalWaybillForm(page, {
  tenantBaseUrl,
  startDate,
  finishDate,
  warehouseName,
  checkoutName,
}) {
  const today = new Date();

  const dialog = await openAddWaybillDialog(page, { tenantBaseUrl });
  await selectWaybillTypeAndContinue(page, dialog, "internal");

  await fillWaybillDates(page, {
    startDate:  startDate  ?? today,
    finishDate: finishDate ?? today,
  });

  await selectWarehouse(page, warehouseName);
  await selectCheckout(page, checkoutName);
}

export async function fillAddressDetails(page, { address, reason, route, destinationSubsidiary }) {
  await fillInput(page, "Ingrese la dirección completa", address);
  await fillInput(page, "Ingrese la razón de la entrega", reason);
  await fillInput(page, "Ingrese la ruta de la entrega", route);

  if (destinationSubsidiary) {
    const subsidiaryAutocomplete = page.getByRole("combobox", { name: "Seleccione Sucursal Destino" });
    await subsidiaryAutocomplete.scrollIntoViewIfNeeded();
    await subsidiaryAutocomplete.click({ delay: 100 });

    const firstOption = page.locator(".v-overlay-container .v-overlay--active .v-list-item").first();
    
    try {
      await firstOption.waitFor({ state: "visible", timeout: 3000 });
    } catch {
      await subsidiaryAutocomplete.click({ force: true, delay: 100 });
      await firstOption.waitFor({ state: "visible", timeout: 10000 });
    }
    
    await firstOption.click();
    await expect(firstOption).not.toBeVisible();
  }
}

export async function searchAndSelectShipmentProduct(page, productName) {
  const searchInput = page.locator("#searchInput").first();
  await searchInput.fill(productName);

  const productCard = page.locator(".v-virtual-scroll .v-card").filter({ hasText: productName }).first();
  await productCard.click();

  await expect(page.locator(".v-card").filter({ hasText: /seleccionado/i }).first()).toBeVisible();
}

export async function fillShipmentAmount(page, amount) {
  await fillInput(page, "Ingrese la cantidad a enviar", String(amount));
}

export async function submitWaybillAndVerify(page, { tenantBaseUrl }) {
  const saveBtn = page.getByRole("button", { name: /Guardar/i }).filter({ hasText: /Guardar/i }).first();
    await Promise.all([
    page.waitForResponse(res => 
      res.url().includes('/api/v2/billing/waybills') && 
      res.request().method() === 'POST' && 
      res.status() === 201
    ),
    saveBtn.click({ force: true })
  ]);

  await expect(page.locator(".v-snackbar").filter({ hasText: /Proceso realizado correctamente/i })).toBeVisible();
  
  await expect(page).toHaveURL(/\/admin\/waybills\/list/);
}

export async function openCarrierSelectorAndSelect(page, searchTerm) {
  const selectorBtn = page.locator(".v-text-field:has(input[placeholder='Ingresa Cédula o RUC']) + button").first();
  await selectorBtn.click();

  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Busca lo que necesites/i }).first();
  
  const searchInput = dialog.getByRole("textbox").first();
  await searchInput.fill(searchTerm);

  const firstRow = dialog.locator(".v-data-table__tr").filter({ hasText: searchTerm }).first();
  await expect(firstRow).toBeVisible();
  await firstRow.click();

  await expect(dialog).not.toBeVisible();
}

export async function addCarrierViaEmployeeForm(page, {
  identityType,
  identity,
  expectedName,
}) {
  const carrierInput = page.getByPlaceholder("Ingresa Cédula o RUC").first();
  const carrierField = page.locator(".v-text-field").filter({ has: carrierInput }).first();
  
  const searchBtn = carrierField.locator("button").last();
  await searchBtn.click();

  const dialog = page.locator(".v-dialog").filter({ hasText: /Agregar Empleado/i }).first();

  const identityTypeSelect = dialog.locator(".v-select").first();
  await identityTypeSelect.scrollIntoViewIfNeeded();
  await identityTypeSelect.click({ delay: 100 });

  const identityTypeOption = page.locator(".v-list-item").filter({ hasText: new RegExp(`^\\s*${identityType}\\s*$`) }).first();
  
  try {
    await identityTypeOption.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    await identityTypeSelect.click({ force: true, delay: 100 });
    await identityTypeOption.waitFor({ state: "visible", timeout: 5000 });
  }
  
  await identityTypeOption.click();
  await expect(identityTypeOption).not.toBeVisible();

  const identityInput = dialog.locator("#employee-identity-input");
  await expect(identityInput).not.toHaveAttribute("readonly");
  await identityInput.fill(identity);

  const magnifyBtn = dialog.locator(".v-input__append button").first();
  await magnifyBtn.click();

  const nameInput = dialog.locator(".v-card-text input").filter({ hasValue: expectedName }).first();
  await expect(nameInput).toBeVisible({ timeout: 20_000 });

  const saveBtn = dialog.getByRole("button", { name: /Guardar Empleado/i });
  await saveBtn.click();

  await expect(dialog).not.toBeVisible();
}

export async function selectSaleFromModal(page, index = 0) {
  const selectSaleBtn = page.getByRole("button", { name: /Seleccionar venta/i }).first();
  await selectSaleBtn.click();

  const modal = page.locator(".v-overlay__content").filter({ hasText: /Ventas Electrónicas Autorizadas/i }).first();
  await expect(modal).toBeVisible();

  const row = modal.locator(".v-data-table__tr").nth(index);
  await row.click();

  await expect(modal).not.toBeVisible();
}

export async function fillExternalWaybillForm(page, {
  tenantBaseUrl,
  startDate,
  finishDate,
  checkoutName,
  saleIndex = 0,
}) {
  const today = new Date();

  const dialog = await openAddWaybillDialog(page, { tenantBaseUrl });
  await selectWaybillTypeAndContinue(page, dialog, "external");

  await selectSaleFromModal(page, saleIndex);

  await fillWaybillDates(page, {
    startDate:  startDate  ?? today,
    finishDate: finishDate ?? today,
  });

  await selectCheckout(page, checkoutName);
}

export async function selectFirstAvailableShipmentProductFromSale(page) {
  const productField = page.locator('.v-autocomplete').last().locator('.v-field').first();
  await productField.scrollIntoViewIfNeeded();
  await productField.click({ delay: 100 });

  const option = page.locator(".v-overlay-container .v-overlay--active .v-list-item").first();
  
  try {
    await option.waitFor({ state: "visible", timeout: 3000 });
  } catch {
    await productField.click({ force: true, delay: 100 });
    await option.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      throw new Error("The dropdown opened, but it is empty. The selected sale has no remaining quantity available for shipment.");
    });
  }
  
  await option.click();
  await expect(option).not.toBeVisible();
}