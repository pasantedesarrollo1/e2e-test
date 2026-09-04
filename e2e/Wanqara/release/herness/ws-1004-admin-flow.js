import { expect } from "@playwright/test";
import { ensureAuthenticated } from "../../harness/auth.js";

export async function selectCustomCheckout(page, bodegaName, cajaName) {
  const bodegaLabel = page.locator("main").getByText(/Bodega/i).first();
  const bodegaInput = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await bodegaInput.locator('.v-icon').last().click();
  
  const listboxBodega = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
  await expect(listboxBodega).toBeVisible({ timeout: 5000 });
  await listboxBodega.getByRole("option", { name: new RegExp(bodegaName, "i") }).first().click();
  await expect(listboxBodega).not.toBeVisible({ timeout: 5000 });

  await page.waitForTimeout(1500);

  const cajaLabel = page.locator("main").getByText(/Punto de Venta/i).first();
  const cajaInput = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await cajaInput.locator('.v-icon').last().click();
  
  const listboxCaja = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
  await expect(listboxCaja).toBeVisible({ timeout: 5000 });
  await listboxCaja.getByRole("option", { name: new RegExp(cajaName, "i") }).first().click();
  await expect(listboxCaja).not.toBeVisible({ timeout: 5000 });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

export async function submitValidatedAdminTransaction(page, endpointPattern) {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true }).first();
  await expect(saveBtn).toBeEnabled({ timeout: 10000 });

  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes(endpointPattern) && res.request().method() === "POST"),
    saveBtn.click({ force: true })
  ]);

  const payload = response.request().postDataJSON();

  expect(payload.subsidiary, 'The sale payload must contain the subsidiary object').toBeDefined();
  expect(payload.checkout, 'The sale payload must contain the checkout object').toBeDefined();
  
  if (payload.checkout.subsidiary_id) {
    expect(
      payload.subsidiary.id, 
      `SEQUENTIAL ALERT: Attempted to bill with subsidiary ${payload.subsidiary.id} but the checkout belongs to ${payload.checkout.subsidiary_id}`
    ).toBe(payload.checkout.subsidiary_id);
  }

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /guardada|correctamente/i }).first()
  ).toBeVisible({ timeout: 15000 });
}

export async function switchSubsidiaryFromProfile(page, targetSubsidiary) {
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

  await page.keyboard.press("Escape");
  await expect(profileModal).not.toBeVisible({ timeout: 5000 }).catch(() => {});

  await page.waitForLoadState("networkidle");
  await expect(
    page.locator("header").first().locator("button").filter({ hasText: new RegExp(shortName, "i") }).first()
  ).toBeVisible({ timeout: 15000 });
}

export async function selectCustomDocumentType(page, documentType) {
  if (!documentType) return;

  const normalize = (s) => s.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
  const FACTURA_CODES = ["01"];

  const docLabel = page.locator("main").getByText("Tipo de Documento").first();
  const docCombo = docLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await expect(docCombo).toBeVisible({ timeout: 10000 });

  const currentText = normalize(await docCombo.innerText());
  const normalizedTarget = normalize(documentType);

  const alreadySelected =
    currentText.includes(normalizedTarget) ||
    (documentType === "Factura electrónica" && FACTURA_CODES.some((code) => currentText.includes(code)));

  if (alreadySelected) {
    return; 
  }

  await docCombo.click();
  const activeListbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
  await expect(activeListbox).toBeVisible({ timeout: 5000 });

  const option = activeListbox.getByRole("option", { name: new RegExp(normalizedTarget, "i") }).first();
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();

  await expect(activeListbox).not.toBeVisible({ timeout: 5000 });
  await page.keyboard.press("Escape");
}

export async function selectClientByCedula(page, cedula) {
  const cedulaInput = page.getByPlaceholder(/Ingresa Cédula o RUC/i).first();

  await cedulaInput.click();
  await cedulaInput.clear();
  
  await cedulaInput.pressSequentially(cedula, { delay: 50 });
  await page.waitForTimeout(300);
  await cedulaInput.press("Enter");

  const clientModal = page.locator(".v-overlay__content:not(.v-snackbar__wrapper)").filter({
    hasText: /Cliente/i,
  }).first();

  try {
    await expect(clientModal).toBeVisible({ timeout: 8000 });
  } catch {}

  if (await clientModal.isVisible()) {
    const alertMessage = clientModal.getByText(/Seleccione un tipo de identificación para continuar/i);
    const saveBtn = clientModal.getByRole("button", { name: /Guardar Cliente/i });
    
    const readyCondition = saveBtn.or(alertMessage);
    await expect(readyCondition).toBeVisible({ timeout: 15000 }).catch(() => {});

    if (await alertMessage.isVisible()) {
      const typeSelect = clientModal.locator(".v-select").first();
      await typeSelect.click({ force: true });
      
      const activeListbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
      await expect(activeListbox).toBeVisible({ timeout: 5000 });
      
      await activeListbox.getByRole("option", { name: /^CEDULA$/i }).click({ force: true });
      
      if (await activeListbox.isVisible().catch(() => false)) {
        await page.keyboard.press("Escape");
      }
      await expect(activeListbox).not.toBeVisible({ timeout: 5000 });

      const innerIdInput = clientModal.locator("input").filter({ hasValue: cedula }).first();
      await innerIdInput.focus();
      
      const searchIconBtn = clientModal.locator("button").filter({ has: page.locator(".mdi-magnify") }).first();
      if (await searchIconBtn.isVisible()) {
        await searchIconBtn.click({ force: true });
      } else {
        await innerIdInput.press("Enter");
      }
      
      await page.waitForTimeout(1000); 
    }

    if (await saveBtn.isVisible()) {
      await expect(saveBtn).toBeEnabled({ timeout: 10000 }).catch(() => {});
      await saveBtn.click({ force: true });
      await expect(clientModal).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  }

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i })
  ).toBeVisible({ timeout: 15000 }).catch(() => {});

  await expect(
    page.locator("main").getByText(cedula, { exact: false }).first()
  ).toBeVisible({ timeout: 15000 });
}

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

export async function applyGeneralDiscount(page, rate) {
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

export async function applyManualSurcharge(page, rate) {
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

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/pos") && res.request().method() === "POST",
      { timeout: 10000 }
    ).catch(() => {}),
    assignBtn.click({ force: true }),
  ]);

  await expect(input).not.toBeVisible({ timeout: 5000 });
}

export async function selectPaymentMethod(page, methodName) {
  const methodItem = page.getByText(methodName, { exact: true }).first();
  await methodItem.scrollIntoViewIfNeeded();
  await methodItem.click({ force: true });
}

export async function selectCheckout(page) {
  const bodegaLabel = page.locator("main").getByText("Bodega").first();
  if (await bodegaLabel.isVisible()) {
    const bodegaWrapper = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
    const text = await bodegaWrapper.innerText();
    const cleanText = text.replace(/Bodega|\*/ig, "").trim();
    
    if (cleanText.length === 0) {
      const dropdownIcon = bodegaWrapper.locator('.v-icon').last();
      await dropdownIcon.click({ force: true });
      const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
      await expect(listbox).toBeVisible({ timeout: 2000 });
      await listbox.getByRole("option").first().click();
      await expect(listbox).not.toBeVisible({ timeout: 2000 });
    }
  }

  const cajaLabel = page.locator("main").getByText("Punto de Venta").first();
  await expect(cajaLabel).toBeVisible({ timeout: 10000 });
  
  const cajaWrapper = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  const cajaText = await cajaWrapper.innerText();
  const cleanCajaText = cajaText.replace(/Punto de Venta|Caja|\*/ig, "").trim();
  
  if (cleanCajaText.length === 0) {
    const dropdownIcon = cajaWrapper.locator('.v-icon').last();
    await dropdownIcon.click({ force: true });
    const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
    await expect(listbox).toBeVisible({ timeout: 2000 });
    await listbox.getByRole("option").first().click();
    await expect(listbox).not.toBeVisible({ timeout: 2000 });
  }

  await page.locator("main").click({ position: { x: 10, y: 10 }, force: true });
  await page.waitForTimeout(200);
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
  clientCedula,
  productName,
  searchTerm,
  beforeFinish,
  paymentMethod,
  skipNavigation = false,
}) {
  if (!skipNavigation) {
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/ventas/add", authType });
    await page.waitForURL(/\/admin\/ventas\/add/);
  }

  await selectCheckout(page);
  await selectCustomDocumentType(page, documentType);
  
  if (clientCedula) {
    await selectClientByCedula(page, clientCedula);
  }

  if (productName) {
    await searchAndSelectProduct(page, { name: productName, searchTerm });
  }

  if (beforeFinish) {
    await beforeFinish(page);
  }

  if (paymentMethod) {
    await selectPaymentMethod(page, paymentMethod);
  }
  
  await submitAdminSale(page);
}