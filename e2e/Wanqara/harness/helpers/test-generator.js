/**
 * Patrón Pure Fabrication: Generador centralizado de Data-Driven Tests (DDT).
 * Encapsula el boilerplate repetitivo de:
 * - Manejo de skip/only y sus razones
 * - Construcción de tags de ejecución (@regression, @release, etc.)
 * - Anotación de tickets (annotateTicket)
 * - Configuración del contexto (test.use con storageState y subsidiaryName)
 * 
 * @param {import('@playwright/test').TestType} test - El objeto test de Playwright.
 * @param {Array} scenarios - El array de escenarios JSON.
 * @param {Function} testFn - La función que define los tests iterados. Recibe el (scenario).
 */
import { annotateTicket } from "./reporting/annotate.js";
import { getSessionPath } from "./auth/auth.js";

export function generateDataDrivenTests(test, scenarios, testFn) {
  for (const scenario of scenarios) {
    if (scenario.skip) {
      test.describe.skip(`Escenario: ${scenario.description}`, () => {
        const razon = scenario.skipReason ? scenario.skipReason : 'Omitido por configuración en JSON';
        test(`Omitido: ${razon}`, async () => {});
      });
      continue;
    }

    // Aplicar Null Object Pattern (GRASP)
    scenario.metadata = scenario.metadata || { ws: null, testScope: "regression" };

    const executionTag = `@${scenario.metadata.testScope}`;
    const describeBlock = scenario.only ? test.describe.only : test.describe;

    // Use description from JSON if present, otherwise just Escenario.
    // Some specs use custom describe blocks, but the standardized one starts with Escenario:
    describeBlock(`Escenario: ${scenario.description} ${executionTag}`, () => {
      if (scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }
      
      const useConfig = {};
      const scope = scenario.metadata.testScope || "regression";
      const loginMode = scenario.loginMode || (scope === "release" ? "fresh" : "cached");
      
      if (scenario.authType && loginMode === "cached") {
        useConfig.storageState = getSessionPath(scenario.authType);
      } else if (loginMode === "fresh") {
        useConfig.storageState = { cookies: [], origins: [] };
      }
      
      if (scenario.subsidiaryName) {
        useConfig.subsidiaryName = scenario.subsidiaryName;
      }
      if (scenario.subsidiaryCode) useConfig.subsidiaryCode = scenario.subsidiaryCode;
      if (scenario.openingAmount) useConfig.openingAmount = scenario.openingAmount;
      if (scenario.authType) useConfig.authType = scenario.authType;
      if (loginMode) useConfig.loginMode = loginMode;
      if (scenario.businessType) useConfig.businessType = scenario.businessType;
      if (scenario.dispatchEnabled !== undefined) useConfig.dispatchEnabled = scenario.dispatchEnabled;
      if (scenario.cashRegisterMode) useConfig.cashRegisterMode = scenario.cashRegisterMode;
      if (scenario.chefAuthType) useConfig.chefAuthType = scenario.chefAuthType;
      if (scenario.stageSetupOptions) useConfig.stageSetupOptions = scenario.stageSetupOptions;
      
      if (Object.keys(useConfig).length > 0) {
        test.use(useConfig);
      }

      testFn(scenario);
    });
  }
}
