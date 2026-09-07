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
    // Wait for the printers config tab/page to be visible
    await page.waitForLoadState('networkidle');

    // Extract dynamic version from the summary text (e.g. "Windows · v3.2.0.0 · 64 bits · 42,9 MB")
    const summaryLocator = page.locator('span.text-medium-emphasis', { hasText: 'Windows · v' }).first();
    await expect(summaryLocator).toBeVisible();
    const summaryText = await summaryLocator.textContent();
    const versionMatch = summaryText.match(/v\d+\.\d+\.\d+\.\d+/);
    expect(versionMatch).not.toBeNull();
    const dynamicVersion = versionMatch[0];

    // Navigate to GitHub releases page to verify version
    await page.goto('https://github.com/KevinWanqara/Wanqara-device-admin/releases');

    // Wait for the release list to load and verify the extracted version exists
    await page.getByRole('heading', { name: 'Release list' }).waitFor({ state: 'visible', timeout: 15000 });
    
    // Check if the specific tag link exists
    const releaseLink = page.locator('a').filter({ hasText: new RegExp(`^${dynamicVersion.replace(/\\./g, '\\\\.')}$`) }).first();
    await expect(releaseLink).toBeVisible();
  });

});
