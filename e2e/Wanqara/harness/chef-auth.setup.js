import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { loginChef, CHEF_AUTH_PATH, CHEF_SESSION_PATH } from "./chef-auth.js";
import { hasChefCredentials, chefHarness } from "./settings.js";

setup("authenticate chef", async ({ page }) => {
  fs.mkdirSync(path.dirname(CHEF_SESSION_PATH), { recursive: true });

  if (!hasChefCredentials()) {
    fs.writeFileSync(CHEF_SESSION_PATH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const chefBaseUrl = chefHarness.baseUrl;

  await loginChef(page, {
    chefBaseUrl,
    login: chefHarness.login,
  });

  await expect(page).not.toHaveURL(CHEF_AUTH_PATH);

  await page.context().storageState({ path: CHEF_SESSION_PATH });
});