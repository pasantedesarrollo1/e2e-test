import { expect } from '@playwright/test';
import { expectSnackbar } from "../../../../../harness/helpers/ui-helpers.js";

export async function createWarehouse(page, { name, code, address, description }) {
  await page.getByRole('link', { name: /Agregar Bodega/i }).first().click();
  
  // Usamos regex para evitar problemas con codificación de tildes (Creación)
  await expect(page.getByText(/Creaci.n de Bodega/i)).toBeVisible();

  await page.getByPlaceholder('Nombre de la Bodega').fill(name);
  
  // (Código)
  await page.getByPlaceholder(/C.digo de la Bodega/i).fill(code);
  
  // (Dirección)
  await page.getByPlaceholder(/Direcci.n de la Bodega/i).fill(address);
  
  // (Descripción)
  await page.getByPlaceholder(/Descripci.n de la Bodega/i).fill(description);

  const saveBtn = page.getByRole('button', { name: /^Guardar$/i }).first();

  const [createResponse] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/v1/general/warehouses') && res.request().method() === 'POST'),
    saveBtn.click(),
  ]);

  expect(createResponse.status()).toBe(201);
  await expectSnackbar(page, /Bodega creada correctamente/i);
}
