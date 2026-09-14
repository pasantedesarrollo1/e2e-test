import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { chefHarness, hasChefCredentials } from "../config/settings.js";
import { CHEF_AUTH_PATH, CHEF_SESSION_PATH, loginChef } from "../helpers/auth/chef-auth.js";

setup("authenticate chef", async ({ page }) => {
  fs.mkdirSync(path.dirname(CHEF_SESSION_PATH), { recursive: true });

  // --- INICIO DE CACHÉ INTELIGENTE ---
  if (fs.existsSync(CHEF_SESSION_PATH)) {
    try {
      const stats = fs.statSync(CHEF_SESSION_PATH);
      // Validamos si la sesión tiene menos de 1 hora de antigüedad para evitar tokens expirados en backend
      const isFresh = (Date.now() - stats.mtimeMs) < 1 * 60 * 60 * 1000;
      const content = JSON.parse(fs.readFileSync(CHEF_SESSION_PATH, 'utf8'));
      if (isFresh && ((content.cookies && content.cookies.length > 0) || (content.origins && content.origins.length > 0))) {
        console.log(`[Setup] Caché activa encontrada para CHEF. Saltando login ⚡`);
        return; 
      }
    } catch (e) {
      // ignore
    }
  }
  // --- FIN DE CACHÉ INTELIGENTE ---


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