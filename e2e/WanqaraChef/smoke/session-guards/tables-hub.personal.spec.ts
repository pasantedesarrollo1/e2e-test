import { test, expect } from '@playwright/test';
import { visibleTestId } from '../../harness/ionic.js';
import { expectTablesHub } from '../../harness/tables.js';
import { hasFullCredentials, requireCredentials } from '../../harness/settings.js';

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

