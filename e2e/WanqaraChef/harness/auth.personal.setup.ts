import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  loginPersonal,
  SESSION_PERSONAL_PATH,
} from './auth.js';
import { hasFullCredentials, hasSubsidiary } from './settings.js';

setup('authenticate personal', async ({ page }) => {
  fs.mkdirSync(path.dirname(SESSION_PERSONAL_PATH), { recursive: true });

  if (!hasFullCredentials() || !hasSubsidiary()) {
    fs.writeFileSync(
      SESSION_PERSONAL_PATH,
      JSON.stringify({ cookies: [], origins: [] }),
    );
    return;
  }

  await loginPersonal(page);
  await expect(page).toHaveURL(/\/tables/);
  await expect(page).not.toHaveURL(/\/check-responsible/);
  await page.context().storageState({ path: SESSION_PERSONAL_PATH });
});
