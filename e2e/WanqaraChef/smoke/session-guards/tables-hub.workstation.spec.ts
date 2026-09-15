import { expect, test } from '@playwright/test';
import { visibleTestId } from '../../harness/ionic.js';
import {
  hasFullCredentials,
  hasWorkstationCode,
  requireCredentials,
  requireWorkstationCode,
} from '../../harness/settings.js';
import { expectTablesHub } from '../../harness/tables.js';

test.describe('Tables hub workstation @smoke', () => {
  test.beforeEach(() => {
    requireCredentials(test);
    requireWorkstationCode(test);
  });

  test('hub de mesas carga con sesión Workstation (sin redirect a PIN)', async ({ page }) => {
    test.skip(
      !hasFullCredentials() || !hasWorkstationCode(),
      'Missing Playwright credentials',
    );

    await expectTablesHub(page);
    await expect(visibleTestId(page, 'tables-menu-button')).toBeVisible();
  });
});

