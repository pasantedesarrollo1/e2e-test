import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { chefHarness, hasChefCredentials } from "../config/settings.js";
import { CHEF_AUTH_PATH, CHEF_SESSION_PATH, loginChef } from "../helpers/auth/chef-auth.js";
import { isSessionFresh } from "../helpers/auth/session-cache.js";

setup("authenticate chef", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);
  fs.mkdirSync(path.dirname(CHEF_SESSION_PATH), { recursive: true });

  // --- INICIO DE CACHÉ INTELIGENTE ---
  if (isSessionFresh(CHEF_SESSION_PATH)) {
    console.log(`[Setup] Caché activa encontrada para CHEF. Saltando login ⚡`);
    return;
  }
  // --- FIN DE CACHÉ INTELIGENTE ---


  if (!hasChefCredentials()) {
    fs.writeFileSync(CHEF_SESSION_PATH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }


  const defaultBranches = JSON.parse(
    fs.readFileSync(path.resolve(path.dirname(CHEF_SESSION_PATH), "../config/default-branches.json"), "utf-8")
  );

  await loginChef(page, {
    login: chefHarness.login,
    subsidiary: defaultBranches.restaurant.name,
    subsidiaryCode: defaultBranches.restaurant.code
  });

  await expect(page).not.toHaveURL(CHEF_AUTH_PATH);

  await page.context().storageState({ path: CHEF_SESSION_PATH });
});