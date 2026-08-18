import { test, expect } from '@playwright/test';
import { requirePosCredentials, getTenantBaseUrl } from '../../../../harness/settings.js';
import { withPath } from '../../../../harness/urls.js';
import { deleteRecordFromList } from '../../../../harness/crud-helpers.js';
import { SEED } from '../../../../harness/seed.js';

test.describe('Warehouse Management CRUD', () => {
  requirePosCredentials(test);

  const { name, code, address, description } = SEED.warehouses.crud[0];

  test('Successfully create, search, and delete a warehouse', async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const listPath = withPath(tenantBaseUrl, '/admin/warehouses/list');

    await test.step('Step 1: Clean previous record if it exists', async () => {
      await page.goto(listPath);
      await page.waitForLoadState('networkidle');
      await deleteRecordFromList(page, {
        searchName: name,
        endpointPattern: '/api/v1/general/warehouses',
        confirmButtonRegex: /^Eliminar$/i,
        successMessage: 'Bodega eliminada correctamente'
      });
    });

    await test.step('Step 2: Create the new warehouse', async () => {
      await page.getByRole('link', { name: /Agregar Bodega/i }).first().click();
      await expect(page.getByText(/Creación de Bodega/i)).toBeVisible();

      await page.getByPlaceholder('Nombre de la Bodega').fill(name);
      await page.getByPlaceholder('Código de la Bodega').fill(code);
      await page.getByPlaceholder('Dirección de la Bodega').fill(address);
      await page.getByPlaceholder('Descripción de la Bodega').fill(description);

      const saveBtn = page.getByRole('button', { name: /^Guardar$/i }).first();

      const [createResponse] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/v1/general/warehouses') && res.request().method() === 'POST'),
        saveBtn.click(),
      ]);

      expect(createResponse.status()).toBe(201);
      await expect(page.locator('.v-snackbar').filter({ hasText: /Bodega creada correctamente/i }).first()).toBeVisible();
    });

    await test.step('Step 3: Verify list and delete the created warehouse', async () => {
      await page.goto(listPath);
      await page.waitForLoadState('networkidle');
      
      await deleteRecordFromList(page, {
        searchName: name,
        endpointPattern: '/api/v1/general/warehouses',
        confirmButtonRegex: /^Eliminar$/i,
        successMessage: 'Bodega eliminada correctamente'
      });
    });

  });
});