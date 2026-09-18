import { type Page } from "@playwright/test";
import { loginAndSelectSubsidiary, switchAdminSubsidiary, isSharedSessionSuspect, recoverSharedSession } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { playwrightHarness } from "@/e2e/Wanqara/harness/config/settings.js";

export interface ScenarioMetadata {
  testScope?: "release" | "regression";
}

export interface ScenarioConfig {
  authType?: string;
  loginMode?: "fresh" | "cached";
  subsidiaryName?: string;
  subsidiaryCode?: string;
  metadata?: ScenarioMetadata;
}

export interface SetupOptions {
  targetPath?: string;
}

export class SessionInitializer {

  static async setup(page: Page, scenario: ScenarioConfig, { targetPath = "/admin/home" }: SetupOptions = {}): Promise<void> {
    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const loginMode = scenario.loginMode || (scope === "release" ? "fresh" : "cached");
    
    if (!scenario.authType) {
      if (targetPath) {
        await page.goto(targetPath);
      }
      return;
    }

    if (loginMode === "fresh") {
      
      const loginCredentials = playwrightHarness.users[scenario.authType as keyof typeof playwrightHarness.users];
      if (!loginCredentials) {
        throw new Error(`❌ No hay credenciales configuradas en settings.js para el authType: "${scenario.authType}"`);
      }

      if (!scenario.subsidiaryCode || !scenario.subsidiaryName) {
        throw new Error(`❌ En loginMode "fresh", debes declarar explícitamente "subsidiaryName" y "subsidiaryCode" en el JSON.`);
      }

      await page.context().clearCookies();
      await page.goto("/login");
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });

      await loginAndSelectSubsidiary(page, {
        login: loginCredentials,
        subsidiaryName: scenario.subsidiaryName,
        subsidiaryCode: scenario.subsidiaryCode
      });
      
      if (targetPath && targetPath !== "/pos/home") {
          await page.goto(targetPath);
      }
    } else {
      if (isSharedSessionSuspect(scenario.authType)) {
        await recoverSharedSession(page, { reason: "a previous attempt", authType: scenario.authType });
      }

      if (targetPath) {
        await page.goto(targetPath);
      }
      
      if (page.url().includes("/login")) {
         await recoverSharedSession(page, { reason: "expired session on load", authType: scenario.authType });
         if (targetPath) {
           await page.goto(targetPath);
         }
         
         if (page.url().includes("/login")) {
           throw new Error(
              `❌ La sesión cacheada de "${scenario.authType}" falló (redirigió al login) incluso después del intento de recuperación.`
           );
         }
      }

      if (page.url().includes("/admin") && scenario.subsidiaryName && scenario.subsidiaryCode) {
        await switchAdminSubsidiary(page, scenario.subsidiaryName, scenario.subsidiaryCode);
        
        if (targetPath && targetPath !== "/pos/home") {
          await page.goto(targetPath);
          // eslint-disable-next-line playwright/no-networkidle
          // EXPLICACIÓN: Se requiere 'networkidle' porque el estado de sesión 
    // depende de peticiones de fondo de hidratación del carrito/estado inicial
    // que no tienen un endpoint único predecible y fallarían las validaciones iniciales.
    await page.waitForLoadState("networkidle");
        }
      }
    }
  }
}
