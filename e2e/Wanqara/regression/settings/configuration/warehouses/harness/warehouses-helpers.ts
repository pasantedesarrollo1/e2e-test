/* eslint-disable */
import type { Page } from '@playwright/test';
export interface WarehouseOptions { name: string; code: string; address: string; description: string; }
import { expect } from '@playwright/test';
import { expectSnackbar } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

export async function createWarehouse(page: Page, { name, code, address, description }: WarehouseOptions): Promise<void> {
  await page.getByRole('link', { name: /Agregar Bodega/i }).first().click();
  
  await expect(page.getByText(/Creaci.n de Bodega/i)).toBeVisible();

  await page.getByPlaceholder('Nombre de la Bodega').fill(name);
  
  await page.getByPlaceholder(/C.digo de la Bodega/i).fill(code);
  
  await page.getByPlaceholder(/Direcci.n de la Bodega/i).fill(address);
  
  await page.getByPlaceholder(/Descripci.n de la Bodega/i).fill(description);

  const saveBtn = page.getByRole('button', { name: /^Guardar$/i }).first();

  const [createResponse] = await Promise.all([
    page.waitForResponse((res: any) => res.url().includes('/api/v1/general/warehouses') && res.request().method() === 'POST'),
    saveBtn.click(),
  ]);

  expect(createResponse.status()).toBe(201);
  await expectSnackbar(page, /Bodega creada correctamente/i);
}
