import { test, expect } from '@playwright/test';
import { requirePosCredentials, getTenantBaseUrl } from '../../../../harness/settings.js';
import { withPath } from '../../../../harness/urls.js';
import { deleteRecordFromList } from '../../../../harness/crud-helpers.js';
import { SEED } from '../../../../harness/seed.js';
import { ACTION_TOOLTIPS } from '../../../../harness/action-tooltips.js';

test.describe('Subsidiary Management CRUD', () => {
  requirePosCredentials(test);

  for (const { type, name, code, isRestaurant, hasDispatch } of SEED.subsidiaries.crud) {
    
    test(`Successfully create, search, and delete: ${type}`, async ({ page }) => {
      const tenantBaseUrl = getTenantBaseUrl();
      const listPath = withPath(tenantBaseUrl, '/admin/subsidiaries/list');

      await test.step('Step 1: Clean previous record if it exists', async () => {
        await page.goto(listPath);
        await page.waitForLoadState('networkidle');
        await deleteRecordFromList(page, {
          searchName: name,
          endpointPattern: '/api/v1/general/subsidiaries/',
          confirmButtonRegex: /^Eliminar Sucursal$/i,
          successMessage: 'eliminada',
          deleteTooltip: ACTION_TOOLTIPS.subsidiaries.delete
        });
      });

      await test.step('Step 2: Create the new subsidiary', async () => {
        await page.getByRole('link', { name: /Nueva Sucursal/i }).first().click();
        await expect(page.getByText(/Agregar una Sucursal/i)).toBeVisible();

        await page.getByPlaceholder('Nombre de la Sucursal').fill(name);
        await page.getByPlaceholder('Nombre Comercial de la Sucursal').fill(name);
        await page.getByPlaceholder('Código de la Sucursal').fill(code);
        await page.getByPlaceholder('Dirección de la Sucursal').fill('123 Automated Test Address');

        await page.getByPlaceholder('Provincia').click();
        await page.getByRole('option').first().click();

        const cityInput = page.getByPlaceholder('Ciudad');
        await expect(cityInput).toBeEnabled();
        await cityInput.click();
        await page.getByRole('option').first().click();

        await page.getByPlaceholder('Teléfono').fill('0999999999');
        await page.getByPlaceholder('Correo').fill('test_sucursal@wanqara.com');

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

        const confirmModal = page.locator('.v-overlay--active').filter({ hasText: /La configuracion de la/i });
        await expect(confirmModal).toBeVisible();
        await confirmModal.getByRole('checkbox').check({ force: true });

        const [createResponse] = await Promise.all([
          page.waitForResponse(res => res.url().includes('/api/v1/general/subsidiaries') && res.request().method() === 'POST'),
          confirmModal.getByRole('button', { name: /Confirmar y crear/i }).click(),
        ]);

        expect(createResponse.status()).toBe(201);
        await expect(page.locator('.v-snackbar').filter({ hasText: /Creada/i }).first()).toBeVisible();
      });

      await test.step('Step 3: Verify list and delete the created subsidiary', async () => {
        await page.goto(listPath);
        await page.waitForLoadState('networkidle');
        await deleteRecordFromList(page, {
          searchName: name,
          endpointPattern: '/api/v1/general/subsidiaries/',
          confirmButtonRegex: /^Eliminar Sucursal$/i,
          successMessage: 'eliminada',
          deleteTooltip: ACTION_TOOLTIPS.subsidiaries.delete
        });
      });

    });
  }
});