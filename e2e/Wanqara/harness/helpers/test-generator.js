
import { annotateTicket } from "./reporting/annotate.js";
import { getSessionPath } from "./auth/auth.js";

function buildGroupKey(scenario) {
    const scope = scenario.metadata?.testScope ?? "regression";
    const loginMode = scenario.loginMode ?? (scope === "release" ? "fresh" : "cached");
    const authType = scenario.authType ?? "anonymous";
    return `${loginMode}::${authType}`;
}


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

    const groups = new Map();
    for (const scenario of active) {
        const key = buildGroupKey(scenario);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(scenario);
    }

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

                let prefixContent = [];
                if (scenario.metadata.ws) prefixContent.push(scenario.metadata.ws);
                if (scenario.id) prefixContent.push(scenario.id);
                const prefix = prefixContent.length > 0 ? `[${prefixContent.join(' - ')}] ` : '';
                
                describeBlock(`Escenario: ${prefix}${scenario.description} ${executionTag}`, () => {
                    if (scenario.metadata.ws) {
                        annotateTicket(test, scenario.metadata);
                    }

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
