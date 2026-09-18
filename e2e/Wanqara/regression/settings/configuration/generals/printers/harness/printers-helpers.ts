/* eslint-disable */
import type { Page } from '@playwright/test';
export interface VerifyVersionOptions { dynamicVersion?: any; githubReleasesUrl: string; }
import { expect } from '@playwright/test';
export async function getSuggestedPrinterVersion(page: Page): Promise<string> {
  await page.goto('/admin/settings/printers');
  await page.waitForLoadState('networkidle');

  const summaryLocator = page.locator('span.text-medium-emphasis').filter({ hasText: /Windows.*v\d/i }).first();
  await expect(summaryLocator).toBeVisible({ timeout: 15000 });
  
  const summaryText = await summaryLocator.textContent();
  const versionMatch = (summaryText || "").match(/v\d+\.\d+\.\d+\.\d+/);
  
  expect(versionMatch, "Debe contener una versión en formato vX.X.X.X").not.toBeNull();
  
  return (versionMatch as any)[0];
}

export async function verifyVersionOnGithub(page: Page, { dynamicVersion, githubReleasesUrl }: VerifyVersionOptions): Promise<void> {
  await page.goto(githubReleasesUrl);
  await page.getByRole('heading', { name: 'Release list' }).waitFor({ state: 'visible', timeout: 15000 });
  
  const versionRegex = new RegExp(`^${dynamicVersion.replace(/\./g, '\\.')}$`);
  const releaseLink = page.locator('a').filter({ hasText: versionRegex }).first();
  
  await expect(releaseLink).toBeVisible({ timeout: 15000 });
}
