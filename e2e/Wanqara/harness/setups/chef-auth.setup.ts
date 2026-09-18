import { expect, test as setup, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { chefHarness, hasChefCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { CHEF_AUTH_PATH, getChefSessionPath, loginChef } from "@/e2e/Wanqara/harness/helpers/auth/chef-auth.js";
import { isSessionFresh } from "@/e2e/Wanqara/harness/helpers/auth/session-cache.js";

for (const actorKey of Object.keys(chefHarness.users)) {
  setup(`authenticate chef ${actorKey}`, async ({ page }: { page: Page }, testInfo: TestInfo) => {
    testInfo.setTimeout(120_000);
    const sessionPath = getChefSessionPath(actorKey);
    fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

    if (isSessionFresh(sessionPath)) {
      console.log(`[Setup] Caché activa encontrada para CHEF ${actorKey}. Saltando login ⚡`);
      return;
    }

    if (!hasChefCredentials()) {
      fs.writeFileSync(sessionPath, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    const defaultBranches = JSON.parse(
      fs.readFileSync(path.resolve(path.dirname(sessionPath), "../config/default-branches.json"), "utf-8")
    ) as Record<string, { name: string; code: string }>;

    const actorConfig = chefHarness.users[actorKey as keyof typeof chefHarness.users];
    
    await loginChef(page, {
      login: actorConfig,
      subsidiary: defaultBranches[actorKey]?.name || "",
      subsidiaryCode: defaultBranches[actorKey]?.code || ""
    });

    await expect(page).not.toHaveURL(CHEF_AUTH_PATH);

    await page.context().storageState({ path: sessionPath });
  });
}