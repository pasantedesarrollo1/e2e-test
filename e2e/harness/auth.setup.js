import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { clearSharedSessionSuspect, loginAndSelectSubsidiary, SESSION_PATH } from "./auth.js";
import {
  hasTenantData,
  hasLoginCredentials,
  getTenantBaseUrl,
  playwrightHarness,
} from "./settings.js";
import { SEED } from "./seed.js";
import { withPath } from "./urls.js";

setup("authenticate", async ({ page }) => {
  fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true });

  clearSharedSessionSuspect();

  if (!hasTenantData() || !hasLoginCredentials()) {
    fs.writeFileSync(SESSION_PATH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const tenantBaseUrl = getTenantBaseUrl();

  await loginAndSelectSubsidiary(page, {
    tenantBaseUrl,
    login: playwrightHarness.login,
    subsidiaryName: SEED.subsidiary.name,
  });

  await page.goto(withPath(tenantBaseUrl, "/admin/home"));

  await expect(page).toHaveURL(/\/admin\/home(\/|$)/);

  await expect(
    page.getByRole('heading', { name: /Bienvenido ¡Tu crecimiento comienza aquí!/i })
  ).toBeVisible();

  await page.context().storageState({ path: SESSION_PATH });
});