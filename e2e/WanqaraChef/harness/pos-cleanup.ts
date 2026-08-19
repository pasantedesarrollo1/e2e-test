import { expect, type Page } from '@playwright/test';
import { posCleanupConfig, playwrightHarness } from './settings.js';

export async function independentPosCleanup(page: Page) {
  const { url, email, password } = posCleanupConfig;
  const subsidiary = playwrightHarness.subsidiary;

  if (!email || !password || !url || !subsidiary) {
    console.warn('Missing POS credentials or subsidiary in .env. Skipping cleanup.');
    return;
  }

  await page.goto(`${url}/login`);
  
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /Iniciar/i }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  }

  try {
    await page.waitForURL(/\/select-subsidiary/, { timeout: 3000 });
    
    const targetCard = page.locator('.v-card').filter({ hasText: subsidiary }).first();
    await expect(targetCard).toBeVisible({ timeout: 5000 });
    await targetCard.click();
    
    await page.getByRole('button', { name: /Continuar/i }).first().click();
    await expect(page).not.toHaveURL(/\/select-subsidiary/);
  } catch {
    // ignore
  }

  await page.goto(`${url}/pos/restaurant-home`);

  while (true) {
    const triggerLocator = page.getByRole('button', { name: /Más Opciones/i }).first();
    await expect(triggerLocator).toBeVisible({ timeout: 15_000 });
    await triggerLocator.click();

    const drawer = page.locator('.v-navigation-drawer').filter({ hasText: /Opciones/i }).first();
    await expect(drawer).toBeVisible();

    const closeOrderOption = drawer.getByRole('button', { name: /Cerrar Ordenes/i }).first();
    await closeOrderOption.click({ force: true });
    await page.waitForURL(/\/pos\/close-restaurant-order/);

    const emptyMessage = page.getByText(/No hay órdenes disponibles/i);
    const orderCard = page.locator('.tw-border-2.tw-border-gray\\/20.tw-rounded-xl').first();

    await expect(emptyMessage.or(orderCard)).toBeVisible({ timeout: 15_000 });

    if (await emptyMessage.isVisible()) {
      console.log(`[Chef Cleanup] No active tables in ${subsidiary}. Cleanup completed.`);
      break; 
    }

    await orderCard.click();

    const observationInput = page.getByPlaceholder(/Ingresa las observaciones/i);
    await expect(observationInput).toBeVisible();
    
    await observationInput.fill('Automated pre-test cleanup (Chef Independent)');

    const submitCloseBtn = page.getByRole('button', { name: 'Cerrar Orden', exact: true });
    await expect(submitCloseBtn).toBeEnabled();
    await submitCloseBtn.click();

    const confirmBtn = page.getByRole('button', { name: /Confirmar Cierre/i });
    await expect(confirmBtn).toBeVisible();

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/pos/orders/') && res.url().endsWith('/close') && res.request().method() === 'POST'),
      confirmBtn.click()
    ]);

    await expect(page.getByText(/Orden cerrada con éxito/i)).toBeVisible();
    
    await page.goto(`${url}/pos/restaurant-home`);
  }
}