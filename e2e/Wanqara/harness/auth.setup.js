import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { 
  clearSharedSessionSuspect, 
  loginAndSelectSubsidiary, 
  getSessionPath, 
  logoutAndLoginAgain 
} from "./auth.js";
import {
  hasTenantData,
  hasLoginCredentials,
  getTenantBaseUrl,
  playwrightHarness,
} from "./settings.js";
import { SEED } from "./seed.js";
import { withPath } from "./urls.js";
import { configureTenantForAuthType } from "./tenant-setup.js";

const authTypes = ["retail", "dispatch", "restaurant"];

for (const authType of authTypes) {
  setup(`authenticate ${authType}`, async ({ page }) => {
    const sessionPath = getSessionPath(authType);
    fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

    clearSharedSessionSuspect(authType);

    if (!hasTenantData() || !hasLoginCredentials()) {
      fs.writeFileSync(sessionPath, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    const tenantBaseUrl = getTenantBaseUrl();
    const loginCredentials = playwrightHarness.users[authType];
    const subsidiaryName = SEED.subsidiaries[authType].name;

    await loginAndSelectSubsidiary(page, {
      tenantBaseUrl,
      login: loginCredentials,
      subsidiaryName: subsidiaryName,
    });

    console.log(`[Setup] Validando configuración de entorno para: ${authType}...`);
    const configChanged = await configureTenantForAuthType(page, { 
      tenantBaseUrl, 
      authType 
    });

    if (configChanged) {
      console.log(`[Setup] Cambios detectados en ${authType}. Reiniciando sesión para refrescar permisos...`);
      await logoutAndLoginAgain(page, {
        tenantBaseUrl,
        login: loginCredentials,
        subsidiaryName: subsidiaryName,
      });
    } else {
      console.log(`[Setup] Entorno ${authType} está correctamente configurado. Continuamos.`);
    }

    await page.goto(withPath(tenantBaseUrl, "/admin/home"));

    await expect(page).toHaveURL(/\/admin\/home(\/|$)/);

    await expect(
      page.getByRole('heading', { name: /Bienvenido ¡Tu crecimiento comienza aquí!/i })
    ).toBeVisible();

    await page.context().storageState({ path: sessionPath });
  });
}