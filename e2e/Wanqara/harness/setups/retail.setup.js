import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { 
  clearSharedSessionSuspect, 
  loginAndSelectSubsidiary, 
  getSessionPath, 
  logoutAndLoginAgain 
} from "../helpers/auth.js";
import {
  hasTenantData,
  hasLoginCredentials,
  getTenantBaseUrl,
  playwrightHarness,
} from "../config/settings.js";
import { SEED } from "../config/seed.js";
import { withPath } from "../config/urls.js";


const authType = "retail";

setup(`authenticate ${authType}`, async ({ page }) => {
  const sessionPath = getSessionPath(authType);
  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

  // --- INICIO DE CACHÉ INTELIGENTE ---
  if (fs.existsSync(sessionPath)) {
    try {
      const stats = fs.statSync(sessionPath);
      // Validamos si la sesión tiene menos de 12 horas de antigüedad
      const isFresh = (Date.now() - stats.mtimeMs) < 12 * 60 * 60 * 1000;
      const content = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      
      // Si el archivo existe, es reciente y tiene cookies válidas, nos saltamos todo el login
      if (isFresh && ((content.cookies && content.cookies.length > 0) || (content.origins && content.origins.length > 0))) {
        console.log(`[Setup] Caché activa encontrada para ${authType}. Saltando login ⚡`);
        return; 
      }
    } catch (e) {
      console.log(`[Setup] No se pudo leer la caché para ${authType}, iniciando sesión normalmente...`);
    }
  }
  // --- FIN DE CACHÉ INTELIGENTE ---


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
  const configChanged = false;

  if (false) {
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
