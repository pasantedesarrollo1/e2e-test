import { expect } from "@playwright/test";
import { getSessionPath } from "../helpers/auth/auth.js";
import fs from "node:fs";
import path from "node:path";

import defaultBranches from "../config/default-branches.json" with { type: "json" };
import {
  hasLoginCredentials,
  hasTenantData,
  playwrightHarness} from "../config/settings.js";
import {
  clearSharedSessionSuspect,
  loginAndSelectSubsidiary
} from "../helpers/auth/auth.js";
import { isSessionFresh } from "../helpers/auth/session-cache.js";

/**
 * Encapsulates the common authentication and caching setup for Wanqara environments.
 * Returns a Playwright setup callback.
 * 
 * @param {string} authType - The authentication role type (e.g., "retail", "restaurant", "dispatch").
 * @returns {Function} Playwright setup function callback.
 */
export function authenticateByRole(authType) {
  return async ({ page }, testInfo) => {
    testInfo.setTimeout(120_000);
    const sessionPath = getSessionPath(authType);
    fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

    // --- SMART CACHE START ---
    if (isSessionFresh(sessionPath)) {
      console.log(`[Setup] Caché activa encontrada para ${authType}. Saltando login ⚡`);
      return;
    } else {
      console.log(`[Setup] No se encontró caché válida/fresca para ${authType}, iniciando sesión normalmente...`);
    }
    // --- SMART CACHE END ---

    clearSharedSessionSuspect(authType);

    if (!hasTenantData() || !hasLoginCredentials()) {
      fs.writeFileSync(sessionPath, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    const loginCredentials = playwrightHarness.users[authType];
    const subsidiaryName = defaultBranches[authType].name;
    const subsidiaryCode = defaultBranches[authType].code;

    await loginAndSelectSubsidiary(page, {
      login: loginCredentials,
      subsidiaryName: subsidiaryName,
      subsidiaryCode: subsidiaryCode
    });

    console.log(`[Setup] Validando configuración de entorno para: ${authType}...`);
    console.log(`[Setup] Entorno ${authType} está correctamente configurado. Continuamos.`);

    await page.goto("/admin/home");

    await expect(page).toHaveURL(/\/admin\/home(\/|$)/);

    await expect(
      page.getByRole('heading', { name: /Bienvenido ¡Tu crecimiento comienza aquí!/i })
    ).toBeVisible();

    await page.context().storageState({ path: sessionPath });
  };
}
