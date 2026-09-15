import { loginAndSelectSubsidiary, switchAdminSubsidiary } from "../auth/auth.js";
import { playwrightHarness } from "../../config/settings.js";

/**
 * Patrón Builder para el Contexto de Sesión de la prueba.
 * 
 * Es el único punto del framework responsable de decidir CÓMO se inicia sesión
 * (caché vs. en vivo) basado en la configuración del escenario JSON.
 */
export class SessionContextBuilder {
  /**
   * Construye o recupera el contexto de sesión correcto para el escenario.
   * 
   * @param {import('@playwright/test').Page} page - La página proveída por el test runner de Playwright.
   * @param {Object} scenario - El JSON completo del escenario.
   * @param {Object} options - Configuraciones adicionales (ej. targetPath inicial).
   * @returns {Promise<{ page: import('@playwright/test').Page }>} 
   */
  static async build(page, scenario, { targetPath = "/admin/home" } = {}) {
    const scope = (scenario.metadata && scenario.metadata.testScope) ? scenario.metadata.testScope : "regression";
    const loginMode = scenario.loginMode || (scope === "release" ? "fresh" : "cached");
    
    // Si no hay authType, se asume un test anónimo (sin sesión obligatoria).
    if (!scenario.authType) {
      await page.goto(targetPath);
      return { page };
    }

    if (loginMode === "fresh") {
      // En modo 'fresh', el test-generator.js no pasó un storageState, 
      // así que 'page' es un contexto virgen.
      // Hacemos login explícito usando los datos del escenario.
      
      const loginCredentials = playwrightHarness.users[scenario.authType];
      if (!loginCredentials) {
        throw new Error(`❌ No hay credenciales configuradas en settings.js para el authType: "${scenario.authType}"`);
      }

      if (!scenario.subsidiaryCode || !scenario.subsidiaryName) {
        throw new Error(`❌ En loginMode "fresh", debes declarar explícitamente "subsidiaryName" y "subsidiaryCode" en el JSON.`);
      }

      await page.goto("/login");
      await loginAndSelectSubsidiary(page, {
        login: loginCredentials,
        subsidiaryName: scenario.subsidiaryName,
        subsidiaryCode: scenario.subsidiaryCode
      });
      
      // Una vez logueado, navegamos al destino deseado
      if (targetPath && targetPath !== "/pos/home") {
          await page.goto(targetPath);
      }
    } else {
      // Modo 'cached' (default para regresión).
      // El test-generator.js ya ató la 'page' al storageState de este authType.
      // Solo navegamos.
      await page.goto(targetPath);
      
      // Validamos si la sesión de verdad cargó. Si no, significa que la caché murió.
      if (page.url().includes("/login")) {
         throw new Error(
            `❌ La sesión cacheada de "${scenario.authType}" falló (redirigió al login). ` + 
            `Si necesitas que el test inicie sesión limpiamente, añade "loginMode": "fresh" al JSON de la prueba.`
         );
      }

      // Si el JSON pide una sucursal específica y estamos en Admin, cambiamos por UI dinámicamente
      if (page.url().includes("/admin") && scenario.subsidiaryName && scenario.subsidiaryCode) {
        await switchAdminSubsidiary(page, scenario.subsidiaryName, scenario.subsidiaryCode);
        
        // Volvemos a la ruta destino por si el cambio de sucursal nos redirigió al home
        if (targetPath && targetPath !== "/pos/home") {
          await page.goto(targetPath);
          await page.waitForLoadState("networkidle");
        }
      }
    }

    return { page };
  }
}
