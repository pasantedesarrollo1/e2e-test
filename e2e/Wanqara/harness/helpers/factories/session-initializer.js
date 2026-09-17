import { loginAndSelectSubsidiary, switchAdminSubsidiary, isSharedSessionSuspect, recoverSharedSession } from "../auth/auth.js";
import { playwrightHarness } from "../../config/settings.js";

export class SessionInitializer {

  static async setup(page, scenario, { targetPath = "/admin/home" } = {}) {
    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const loginMode = scenario.loginMode || (scope === "release" ? "fresh" : "cached");
    
    if (!scenario.authType) {
      await page.goto(targetPath);
      return;
    }

    if (loginMode === "fresh") {
      
      const loginCredentials = playwrightHarness.users[scenario.authType];
      if (!loginCredentials) {
        throw new Error(`❌ No hay credenciales configuradas en settings.js para el authType: "${scenario.authType}"`);
      }

      if (!scenario.subsidiaryCode || !scenario.subsidiaryName) {
        throw new Error(`❌ En loginMode "fresh", debes declarar explícitamente "subsidiaryName" y "subsidiaryCode" en el JSON.`);
      }

      // -- INICIO DE LIMPIEZA TOTAL PARA "FRESH" --
      await page.context().clearCookies();
      // Navegamos al origen una vez para ganar acceso al contexto de LocalStorage
      await page.goto("/login");
      // Limpiamos todo el almacenamiento local inyectado por Playwright
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      // -- FIN DE LIMPIEZA --

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

      await page.goto(targetPath);
      
      if (page.url().includes("/login")) {
         await recoverSharedSession(page, { reason: "expired session on load", authType: scenario.authType });
         await page.goto(targetPath);
         
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
          await page.waitForLoadState("networkidle");
        }
      }
    }
  }
}
