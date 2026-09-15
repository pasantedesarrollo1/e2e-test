import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { chefHarness, hasChefCredentials } from "../config/settings.js";
import { CHEF_AUTH_PATH, getChefSessionPath, loginChef } from "../helpers/auth/chef-auth.js";
import { isSessionFresh } from "../helpers/auth/session-cache.js";

for (const actorKey of Object.keys(chefHarness.users)) {
  setup(`authenticate chef ${actorKey}`, async ({ page }, testInfo) => {
    testInfo.setTimeout(120_000);
    const sessionPath = getChefSessionPath(actorKey);
    fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

    // --- INICIO DE CACHÉ INTELIGENTE ---
    if (isSessionFresh(sessionPath)) {
      console.log(`[Setup] Caché activa encontrada para CHEF ${actorKey}. Saltando login ⚡`);
      return;
    }
    // --- FIN DE CACHÉ INTELIGENTE ---

    if (!hasChefCredentials()) {
      fs.writeFileSync(sessionPath, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    const defaultBranches = JSON.parse(
      fs.readFileSync(path.resolve(path.dirname(sessionPath), "../config/default-branches.json"), "utf-8")
    );

    await loginChef(page, {
      login: chefHarness.users[actorKey],
      subsidiary: defaultBranches[actorKey]?.name,
      subsidiaryCode: defaultBranches[actorKey]?.code
    });

    await expect(page).not.toHaveURL(CHEF_AUTH_PATH);

    await page.context().storageState({ path: sessionPath });
  });
}