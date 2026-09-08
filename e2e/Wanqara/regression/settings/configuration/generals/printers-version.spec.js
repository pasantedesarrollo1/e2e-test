import { test, expect } from '@playwright/test';
import { requirePosCredentials, getTenantBaseUrl } from '../../../../harness/settings.js';
import { ensureAuthenticated, getSessionPath } from '../../../../harness/auth.js';


const TICKET = {
  ws: 'ws-1055',
  tes: 'TES-219',
  release: 'v7.10.0',
  summary: 'Printer errors and new settings section',
  addedToRegression: 'true',
};

test.describe.serial('Printers Configuration Settings @release', () => {
  test.use({ storageState: getSessionPath('retail') });

  let tenantBaseUrl;

  test.beforeAll(() => {
    requirePosCredentials(test);
    tenantBaseUrl = getTenantBaseUrl();
  });

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, {
      tenantBaseUrl,
      targetPath: '/admin/settings/printers',
      authType: 'retail',
    });
  });

  test('Verify Suggested Printer Version Exists on GitHub Releases', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const summaryLocator = page.locator('span.text-medium-emphasis', { hasText: 'Windows · v' }).first();
    await expect(summaryLocator).toBeVisible();
    const summaryText = await summaryLocator.textContent();
    const versionMatch = summaryText.match(/v\d+\.\d+\.\d+\.\d+/);
    expect(versionMatch).not.toBeNull();
    const dynamicVersion = versionMatch[0];

    await page.goto('https://github.com/KevinWanqara/Wanqara-device-admin/releases');

    await page.getByRole('heading', { name: 'Release list' }).waitFor({ state: 'visible', timeout: 15000 });
    
    const releaseLink = page.locator('a').filter({ hasText: new RegExp(`^${dynamicVersion.replace(/\\./g, '\\\\.')}$`) }).first();
    await expect(releaseLink).toBeVisible();
  });

});
