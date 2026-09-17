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

/**
 * Construye la clave de agrupación para un escenario.
 * Escenarios con la misma clave comparten Worker y storageState.
 */
function buildGroupKey(scenario) {
    const scope = scenario.metadata?.testScope ?? "regression";
    const loginMode = scenario.loginMode ?? (scope === "release" ? "fresh" : "cached");
    const authType = scenario.authType ?? "anonymous";
    return `${loginMode}::${authType}`;
}

/**
 * Construye el useConfig para un grupo de escenarios.
 * Se aplica una sola vez al describe del grupo.
 */
function buildGroupUseConfig(scenario) {
    const scope = scenario.metadata?.testScope ?? "regression";
    const loginMode = scenario.loginMode ?? (scope === "release" ? "fresh" : "cached");
    const useConfig = {};

    if (scenario.authType && loginMode === "cached") {
        useConfig.storageState = getSessionPath(scenario.authType);
    } else if (loginMode === "fresh") {
        useConfig.storageState = { cookies: [], origins: [] };
    }

    return useConfig;
}

export function generateDataDrivenTests(test, scenarios, testFn) {
    // 1. Separar skips (no necesitan agrupación)
    const active = [];
    for (const scenario of scenarios) {
        if (scenario.skip) {
            const reason = scenario.skipReason ?? "Omitido por configuración en JSON";
            test.describe.skip(`Escenario: ${scenario.description}`, () => {
                test(`Omitido: ${reason}`, async () => {});
            });
            continue;
        }
        scenario.metadata = scenario.metadata ?? { ws: null, testScope: "regression" };
        active.push(scenario);
    }

    // 2. Agrupar escenarios activos por firma de configuración
    const groups = new Map();
    for (const scenario of active) {
        const key = buildGroupKey(scenario);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(scenario);
    }

    // 3. Por cada grupo: un único test.describe con un único test.use
    for (const [groupKey, groupScenarios] of groups) {
        const representativeScenario = groupScenarios[0];
        const useConfig = buildGroupUseConfig(representativeScenario);

        test.describe(`Grupo [${groupKey}]`, () => {
            if (Object.keys(useConfig).length > 0) {
                test.use(useConfig);
            }

            for (const scenario of groupScenarios) {
                const executionTag = `@${scenario.metadata.testScope}`;
                const describeBlock = scenario.only ? test.describe.only : test.describe;

                // Use description from JSON if present, otherwise just Escenario.
                // Some specs use custom describe blocks, but the standardized one starts with Escenario:
                let prefixContent = [];
                if (scenario.metadata.ws) prefixContent.push(scenario.metadata.ws);
                if (scenario.id) prefixContent.push(scenario.id);
                const prefix = prefixContent.length > 0 ? `[${prefixContent.join(' - ')}] ` : '';
                
                describeBlock(`Escenario: ${prefix}${scenario.description} ${executionTag}`, () => {
                    if (scenario.metadata.ws) {
                        annotateTicket(test, scenario.metadata);
                    }

                    // Propagamos opciones de scenario-level que NO son storageState
                    // (subsidiaryName, openingAmount, etc.) dentro del test individual
                    // para compatibilidad con los fixtures
                    const scenarioOptions = {};
                    if (scenario.subsidiaryName) scenarioOptions.subsidiaryName = scenario.subsidiaryName;
                    if (scenario.subsidiaryCode) scenarioOptions.subsidiaryCode = scenario.subsidiaryCode;
                    if (scenario.openingAmount) scenarioOptions.openingAmount = scenario.openingAmount;
                    if (scenario.authType) scenarioOptions.authType = scenario.authType;
                    if (scenario.loginMode) scenarioOptions.loginMode = scenario.loginMode;
                    if (scenario.businessType) scenarioOptions.businessType = scenario.businessType;
                    if (scenario.dispatchEnabled !== undefined) scenarioOptions.dispatchEnabled = scenario.dispatchEnabled;
                    if (scenario.cashRegisterMode) scenarioOptions.cashRegisterMode = scenario.cashRegisterMode;
                    if (scenario.chefAuthType) scenarioOptions.chefAuthType = scenario.chefAuthType;
                    if (scenario.stageSetupOptions) scenarioOptions.stageSetupOptions = scenario.stageSetupOptions;

                    if (Object.keys(scenarioOptions).length > 0) {
                        test.use(scenarioOptions);
                    }

                    testFn(scenario);
                });
            }
        });
    }
}
