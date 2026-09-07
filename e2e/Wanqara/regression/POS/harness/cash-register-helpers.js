import { expect } from "@playwright/test";
import { openDrawer } from "./pos-sale-flow.js";
import { withPath } from "../../../harness/urls.js";

/**
 * Ensures the cash register is open.
 * If it is open, it closes it and then opens it.
 */
export async function ensureCashRegisterOpen(page, tenantBaseUrl, amount = "10", subsidiaryName) {
  if (!tenantBaseUrl) throw new Error("tenantBaseUrl is required");
  if (!subsidiaryName) throw new Error("subsidiaryName is required");

  await page.goto(withPath(tenantBaseUrl, '/pos/open-cash-register'));

  try {
    await page.waitForURL(/\/pos\/(home|restaurant-home|open-cash-register)/, { timeout: 10000 });
  } catch (e) {
    // ignore timeout
  }

  if (page.url().match(/\/pos\/(home|restaurant-home)/)) {
    // Already open, we must close it first
    await closeCashRegister(page, tenantBaseUrl);
    await page.goto(withPath(tenantBaseUrl, '/pos/open-cash-register'));
    await page.waitForURL(/\/pos\/open-cash-register/);
  }

  // Handle subsidiary selection if present
  const subsidiaryCards = page.locator('.v-card').filter({ hasText: subsidiaryName });
  if (await subsidiaryCards.first().isVisible({ timeout: 3000 })) {
    await subsidiaryCards.first().click();
    const continuarBtn = page.getByRole("button", { name: /Continuar/i });
    if (await continuarBtn.isVisible()) {
      await continuarBtn.click();
    }
  }

  await expect(page.getByText('Puntos de Emisión disponibles')).toBeVisible();

  await expect(page.getByText('Seleccione el punto de Emisión')).toBeVisible();

  // "la caja se mantiene en la que este disponible"
  const firstCheckout = page.locator('.v-card.hover\\:tw-bg-gray-200').first();
  await expect(firstCheckout).toBeVisible();
  await firstCheckout.click();

  const montoInput = page.locator('input[type="number"]').first();
  await montoInput.fill(amount);

  const abrirCajaBtn = page.getByRole("button", { name: /Abrir Caja/i }).first();
  await Promise.all([
    page.waitForResponse(res => res.url().includes('cash-registers') && res.request().method() === 'POST'),
    abrirCajaBtn.click()
  ]);

  await page.waitForURL(/\/pos\/(home|restaurant-home)/);
}

/**
 * Closes the cash register from the home POS screen.
 */
export async function closeCashRegister(page, tenantBaseUrl, options = {}) {
  if (!tenantBaseUrl) throw new Error("tenantBaseUrl is required");

  const { beforeConfirm } = options;
  const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
  const drawerFilter = /Opciones/i;
  
  const drawer = await openDrawer(page, triggerLocator, drawerFilter);
  const closeOption = drawer.getByRole("button", { name: /Cierre de Caja/i }).first();
  await closeOption.click({ force: true });
  
  await page.waitForURL(/\/pos\/close-cash-register/);
  
  await expect(
    page.getByText('Composición del Efectivo'),
    'La caja no renderizó correctamente. Posible error: "No query results for model [Modules\\General\\Models\\CashRegister] undefined"'
  ).toBeVisible({ timeout: 10000 });
  
  if (beforeConfirm) {
    await beforeConfirm();
  }
  
  const acceptBtn = page.getByRole("button", { name: /Cerrar Caja/i }).first();
  await acceptBtn.click();
  const confirmBtn = page.locator('.v-overlay-container').getByRole("button", { name: /Aceptar/i }).last();
  await expect(confirmBtn).toBeVisible();
  
  await Promise.all([
    page.waitForNavigation(),
    page.waitForResponse(res => res.url().includes('/close') && res.request().method() === 'POST'),
    confirmBtn.click()
  ]);
  
  const cancelTicketBtn = page.getByRole("button", { name: /Cancelar/i }).first();
  if (await cancelTicketBtn.isVisible({ timeout: 3000 })) {
     await cancelTicketBtn.click();
  }
}
