import { expect } from "@playwright/test";
import { openDrawer } from '../sales/pos-drawer-helpers.js';
import { formatPosSubsidiary } from '../../../../harness/helpers/ui/ui-helpers.js';

export async function ensureCashRegisterOpen(page, amount, subsidiaryName, subsidiaryCode, homePath = '/pos/home') {
  if (!subsidiaryName) throw new Error("subsidiaryName is required");
  if (!amount) throw new Error("amount is required (e.g. from JSON or settings)");

  await page.goto(homePath);

  const posHomeIndicator = page.getByText(/Cliente:/i).first();
  const openRegisterIndicator = page.getByRole("button", { name: /Abrir Caja/i }).first();
  const selectSubsidiaryIndicator = page.getByText(/Seleccione una sucursal para abrir la caja/i).first();
  const alreadyOpenSnackbar = page.locator('.v-snackbar').filter({ hasText: /Ya hay una caja abierta para esta sucursal/i }).first();

  await expect(
    posHomeIndicator
      .or(openRegisterIndicator)
      .or(selectSubsidiaryIndicator)
      .or(alreadyOpenSnackbar)
      .first()
  ).toBeVisible({ timeout: 20_000 });

  if (await alreadyOpenSnackbar.isVisible()) {
    await expect(posHomeIndicator).toBeVisible({ timeout: 15_000 });
    return;
  }

  if (await posHomeIndicator.isVisible()) {
    return;
  }

  const cancelModalBtn = page.getByRole('button', { name: 'Cancelar', exact: true });
  if (await cancelModalBtn.isVisible({ timeout: 4000 })) {
    await cancelModalBtn.click();
  }

  const formattedName = formatPosSubsidiary(subsidiaryName, subsidiaryCode);
  const subsidiaryCards = page.locator('.v-card').filter({ hasText: formattedName });
  if (await subsidiaryCards.first().isVisible({ timeout: 3000 })) {
    await subsidiaryCards.first().click();
    const continuarBtn = page.getByRole("button", { name: /Continuar/i });
    if (await continuarBtn.isVisible()) {
      await continuarBtn.click();
    }
  }

  await expect(page.getByText('Puntos de Emisión disponibles')).toBeVisible();
  await expect(page.getByText('Seleccione el punto de Emisión')).toBeVisible();

  const checkoutToSelect = page.locator('.v-card.hover\\:tw-bg-gray-200').first();
  await expect(checkoutToSelect).toBeVisible();
  await checkoutToSelect.click();

  const montoInput = page.locator('input[type="number"]').first();
  await montoInput.fill(amount);

  const abrirCajaBtn = page.getByRole("button", { name: /Abrir Caja/i }).first();
  await Promise.all([
    page.waitForResponse(res => res.url().includes('cash-registers') && res.request().method() === 'POST'),
    abrirCajaBtn.click()
  ]);

  await expect(posHomeIndicator).toBeVisible({ timeout: 15_000 });
}

export async function closeCashRegister(page, options = {}) {

  const { beforeConfirm } = options;
  const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
  const drawerFilter = /Opciones/i;
  
  const drawer = await openDrawer(page, triggerLocator, drawerFilter);
  const closeOption = drawer.getByRole("button", { name: /Cierre de Caja/i }).first();
  await closeOption.click({ force: true });
  
  const formIndicator = page.getByText('Composición del Efectivo').first();
  await expect(formIndicator).toBeVisible({ timeout: 15000 });
  
  if (beforeConfirm) {
    await beforeConfirm();
  }
  
  const acceptBtn = page.getByRole("button", { name: /Cerrar Caja/i }).first();
  await acceptBtn.click();
  
  const confirmBtn = page.locator('.v-overlay-container').getByRole("button", { name: /Aceptar/i }).last();
  await expect(confirmBtn).toBeVisible();
  
  await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/close') && 
             res.request().method() === 'POST' && 
             res.status() === 200,
      { timeout: 30_000 }
    ),
    confirmBtn.click()
  ]);
  await page.waitForURL(/\/(pos\/(home|open-cash-register)|admin\/)/, { timeout: 15_000 });
  
  const cancelTicketBtn = page.getByRole("button", { name: /Cancelar/i }).first();
  if (await cancelTicketBtn.isVisible({ timeout: 3000 })) {
     await cancelTicketBtn.click();
  }
}
