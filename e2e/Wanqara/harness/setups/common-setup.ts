import { expect, type Page, type TestInfo } from "@playwright/test";
import { getSessionPath } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import fs from "node:fs";
import path from "node:path";

import defaultBranchesJson from "@/e2e/Wanqara/harness/config/default-branches.json" with { type: "json" };
import {
  hasLoginCredentials,
  hasTenantData,
  playwrightHarness
} from "@/e2e/Wanqara/harness/config/settings.js";
import {
  clearSharedSessionSuspect,
  loginAndSelectSubsidiary
} from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { isSessionFresh } from "@/e2e/Wanqara/harness/helpers/auth/session-cache.js";

const defaultBranches = defaultBranchesJson as Record<string, { name: string; code: string }>;

export function authenticateByRole(authType: string): (args: { page: Page }, testInfo: TestInfo) => Promise<void> {
  return async ({ page }: { page: Page }, testInfo: TestInfo) => {
    testInfo.setTimeout(120_000);
    const sessionPath = getSessionPath(authType);
    fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

    if (isSessionFresh(sessionPath)) {
      console.log(`[Setup] Caché activa encontrada para ${authType}. Saltando login ⚡`);
      return;
    } else {
      console.log(`[Setup] No se encontró caché válida/fresca para ${authType}, iniciando sesión normalmente...`);
    }

    clearSharedSessionSuspect(authType);

    if (!hasTenantData() || !hasLoginCredentials()) {
      fs.writeFileSync(sessionPath, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    const loginCredentials = playwrightHarness.users[authType as keyof typeof playwrightHarness.users];
    
    if (!defaultBranches[authType]) {
      throw new Error(`[Setup] Branch configuration missing for authType: ${authType}`);
    }

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
