/* eslint-disable */
import type { Page } from '@playwright/test';
export interface SubsidiaryOptions { name: string; code: string; isRestaurant?: boolean; hasDispatch?: boolean; }
import { expect } from '@playwright/test';
import { expectSnackbar, selectDropdownOption } from "@/e2e/Wanqara/harness/helpers/admin/ui-helpers.js";

export async function createSubsidiary(page: Page, { name, code, isRestaurant, hasDispatch, address = "Av. Principal 123", phone = "0999999999", email = "test@wanqara.com" }: any) {
  await page.getByRole('link', { name: /Nueva Sucursal/i }).first().click();
  await expect(page.getByText(/Agregar una Sucursal/i)).toBeVisible();

  await page.getByPlaceholder('Nombre de la Sucursal').fill(name);
  await page.getByPlaceholder('Nombre Comercial de la Sucursal').fill(name);
  await page.getByPlaceholder(/C.digo de la Sucursal/i).fill(code);
  await page.getByPlaceholder(/Direcci.n de la Sucursal/i).fill(address);

  await selectDropdownOption(page, { triggerLocator: page.getByPlaceholder('Provincia') });
  
  const cityInput = page.locator('.v-input').filter({ hasText: 'Ciudad' }).first();
  await expect(cityInput).toBeEnabled({ timeout: 10000 });
  await selectDropdownOption(page, { triggerLocator: cityInput });

  await page.getByPlaceholder(/Tel.fono/i).fill(phone);
  await page.getByPlaceholder('Correo').fill(email);

  const commerceOption = page.locator("div[style*='min-width: 90px']").filter({ hasText: /^Comercios$/i }).first();
  const restaurantOption = page.locator("div[style*='min-width: 90px']").filter({ hasText: /Restaurante/i }).first();

  if (isRestaurant) {
    if (await restaurantOption.isVisible()) await restaurantOption.click();
  } else {
    if (await commerceOption.isVisible()) await commerceOption.click();
  }

  const dispatchContainer = page.locator("div").filter({ hasText: /^Despacho posterior/ }).filter({ has: page.locator(".v-switch") }).first();
  if (await dispatchContainer.isVisible()) {
    const switchInput = dispatchContainer.locator("input[type='checkbox']");
    const isDispatchChecked = await switchInput.isChecked();

    if (hasDispatch !== isDispatchChecked) {
      await dispatchContainer.locator(".v-switch").click();
    }
  }

  await page.getByRole('button', { name: /^Guardar$/i }).first().click();

  const confirmModal = page.locator('.v-overlay--active').filter({ hasText: /La configuraci.n de la/i });
  await expect(confirmModal).toBeVisible();
  await confirmModal.getByRole('checkbox').check({ force: true });

  const [createResponse] = await Promise.all([
    page.waitForResponse((res: any) => res.url().includes('/api/v1/general/subsidiaries') && res.request().method() === 'POST'),
    confirmModal.getByRole('button', { name: /Confirmar y crear/i }).click(),
  ]);

  expect(createResponse.status()).toBe(201);
  await expectSnackbar(page, /Creada/i);
}
