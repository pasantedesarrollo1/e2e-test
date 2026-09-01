import { expect } from "@playwright/test";
import { SEED } from "../../harness/seed.js";
import { ensureAuthenticated } from "../../harness/auth.js";
import { searchAndSelectProduct } from "../../regression/POS/harness/pos-search.js";
import { selectClientByCedula } from "../../regression/POS/harness/pos-sale-flow.js";

export async function completeValidatedPosPayment(page) {
  const methodOption = page.getByText(SEED.paymentMethods.efectivo.label, { exact: true }).first();
  await methodOption.click();

  const finalizarVentaButton = page.getByRole("button", { name: /Finalizar Venta/i });

  // Interceptar venta de POS
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/v2/pos/sales') && res.request().method() === 'POST'),
    finalizarVentaButton.click({ force: true }),
  ]);

  const payload = response.request().postDataJSON();

  // VALIDACIÓN ESTRICTA EN POS
  expect(payload.subsidiary).toBeDefined();
  if (payload.subsidiary?.open_cash_register?.checkout?.subsidiary_id) {
    expect(
      payload.subsidiary.id,
      `CRUCE DETECTADO EN POS: Sucursal (${payload.subsidiary.id}) vs Caja (${payload.subsidiary.open_cash_register.checkout.subsidiary_id})`
    ).toBe(payload.subsidiary.open_cash_register.checkout.subsidiary_id);
  }

  await expect(page.locator(".v-snackbar").filter({ hasText: /Venta Realizada/i })).toBeVisible({ timeout: 15000 });
}

export async function runReleasePosSaleFlow(page, tenantBaseUrl, documentType) {
  await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home" });
  await page.waitForURL(/\/pos\/home/);

  // Seleccionar documento dinámico (Recibos o Factura)
  const documentTypeSelect = page.locator(".v-select").filter({ hasText: /Factura|Recibo|Tipo de documento/i }).first();
  const currentValue = await documentTypeSelect.innerText();
  if (!currentValue.includes(documentType)) {
    await documentTypeSelect.click();
    await page.getByRole("option", { name: documentType, exact: true }).click();
  }

  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });

  await page.getByRole("button", { name: /Terminar Venta/i }).click({ force: true });
  await page.waitForURL(/\/pos\/payments/);

  await completeValidatedPosPayment(page);
}

export async function finalizeValidatedRestaurantSale(page) {
  await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);
  
  await page.getByRole("button", { name: /Terminar Venta/i }).click();
  await page.waitForURL(/\/pos\/restaurant-payments/);

  await completeValidatedPosPayment(page);
}