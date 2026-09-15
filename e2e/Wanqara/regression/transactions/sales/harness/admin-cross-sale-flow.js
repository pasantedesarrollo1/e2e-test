import { expect } from "@playwright/test";

export async function selectCustomCheckout(page, bodegaName, cajaName) {
  const bodegaLabel = page.locator("main").getByText(/Bodega/i).first();
  const bodegaInput = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await bodegaInput.locator('.v-icon').last().click();
  
  const listboxBodega = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
  await expect(listboxBodega).toBeVisible({ timeout: 5000 });
  await listboxBodega.getByRole("option", { name: new RegExp(bodegaName, "i") }).first().click();
  await expect(listboxBodega).not.toBeVisible({ timeout: 5000 });

  const cajaLabel = page.locator("main").getByText(/Punto de Venta/i).first();
  const cajaInput = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await cajaInput.locator('.v-icon').last().click();
  
  const listboxCaja = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
  await expect(listboxCaja).toBeVisible({ timeout: 5000 });
  await listboxCaja.getByRole("option", { name: new RegExp(cajaName, "i") }).first().click();
  await expect(listboxCaja).not.toBeVisible({ timeout: 5000 });

  await page.keyboard.press("Escape");
  await expect(page.locator(".v-overlay-container .v-overlay--active")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
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

export { selectClientByCedula } from '../../../../harness/helpers/people/client-helpers.js';
export { searchAndSelectProduct, selectCheckout, submitAdminSale };

  import { searchAndSelectProduct, selectCheckout, submitAdminSale } from './admin-checkout-helpers.js';

  

export async function selectPaymentMethod(page, methodName) {
  const methodItem = page.getByText(methodName, { exact: true }).first();
  await methodItem.scrollIntoViewIfNeeded();
  await methodItem.click({ force: true });
}

