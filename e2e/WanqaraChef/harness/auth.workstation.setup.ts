import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  loginWorkstation,
  SESSION_WORKSTATION_PATH,
} from './auth.js';
import {
  hasFullCredentials,
  hasSubsidiary,
  hasWorkstationCode,
} from './settings.js';

setup('authenticate workstation', async ({ page }) => {
  fs.mkdirSync(path.dirname(SESSION_WORKSTATION_PATH), { recursive: true });

  if (!hasFullCredentials() || !hasWorkstationCode() || !hasSubsidiary()) {
    fs.writeFileSync(
      SESSION_WORKSTATION_PATH,
      JSON.stringify({ cookies: [], origins: [] }),
    );
    return;
  }

  await loginWorkstation(page);
  await expect(page).toHaveURL(/\/tables/);
  await page.context().storageState({ path: SESSION_WORKSTATION_PATH });
});
