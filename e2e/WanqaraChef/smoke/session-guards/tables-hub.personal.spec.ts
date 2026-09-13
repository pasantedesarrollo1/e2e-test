import { expect, test } from '@playwright/test';
import { visibleTestId } from '../../harness/ionic.js';
import { hasFullCredentials, requireCredentials } from '../../harness/settings.js';
import { expectTablesHub } from '../../harness/tables.js';

test.describe('Tables hub personal @smoke', () => {
  test.beforeEach(() => {
    requireCredentials(test);
  });

  test('hub de mesas carga con sesión Personal (sin PIN)', async ({ page }) => {
    test.skip(!hasFullCredentials(), 'Missing Playwright credentials');

    await expectTablesHub(page);
    await expect(visibleTestId(page, 'tables-menu-button')).toBeVisible();
  });
});

