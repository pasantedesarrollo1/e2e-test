import { expect } from '@playwright/test';
import { withPath } from "../../../../../../harness/config/urls.js";

/**
 * Navigates to printers settings and extracts the suggested version for a given platform prefix.
 * Example platformPrefix: "Windows "
 */
export async function getSuggestedPrinterVersion(page, { tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, '/admin/settings/printers'));
  await page.waitForLoadState('networkidle');

  const summaryLocator = page.locator('span.text-medium-emphasis').filter({ hasText: /Windows.*v\d/i }).first();
  await expect(summaryLocator).toBeVisible({ timeout: 15000 });
  
  const summaryText = await summaryLocator.textContent();
  const versionMatch = summaryText.match(/v\d+\.\d+\.\d+\.\d+/);
  
  expect(versionMatch, "Debe contener una versión en formato vX.X.X.X").not.toBeNull();
  
  return versionMatch[0];
}

/**
 * Navigates to GitHub and verifies that the extracted version exists as a release link.
 */
export async function verifyVersionOnGithub(page, { dynamicVersion, githubReleasesUrl }) {
  await page.goto(githubReleasesUrl);
  await page.getByRole('heading', { name: 'Release list' }).waitFor({ state: 'visible', timeout: 15000 });
  
  // Scape the dots for the Regex
  const versionRegex = new RegExp(`^${dynamicVersion.replace(/\./g, '\\.')}$`);
  const releaseLink = page.locator('a').filter({ hasText: versionRegex }).first();
  
  await expect(releaseLink).toBeVisible({ timeout: 15000 });
}
