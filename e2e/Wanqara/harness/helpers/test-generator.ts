import { annotateTicket } from "@/e2e/Wanqara/harness/helpers/reporting/annotate.js";
import { getSessionPath } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import type { TestType } from "@playwright/test";

import type { 
  ScenarioDefinition, 
  TestMetadata,
  AdminScenario,
  PosScenario,
  RestaurantScenario
} from "@/e2e/Wanqara/harness/types/scenarios.types.js";

export type { 
  ScenarioDefinition,
  AdminScenario,
  PosScenario,
  RestaurantScenario, 
  TestMetadata 
};

function buildGroupKey(scenario: ScenarioDefinition): string {
    const scope = scenario.metadata?.testScope ?? "regression";
    const loginMode = scenario.loginMode ?? (scope === "release" ? "fresh" : "cached");
    const authType = scenario.authType ?? "anonymous";
    return `${loginMode}::${authType}`;
}

function buildGroupUseConfig(scenario: ScenarioDefinition): Record<string, unknown> {
    const scope = scenario.metadata?.testScope ?? "regression";
    const loginMode = scenario.loginMode ?? (scope === "release" ? "fresh" : "cached");
    const useConfig: Record<string, unknown> = {};

    if (scenario.authType && loginMode === "cached") {
        useConfig.storageState = getSessionPath(scenario.authType);
    } else if (loginMode === "fresh") {
        useConfig.storageState = { cookies: [], origins: [] };
    }

    return useConfig;
}

// We use 'any' here to support Playwright's polymorphic test object, which changes 
// its signature depending on the custom fixtures extended in each spec file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateDataDrivenTests<T extends ScenarioDefinition>(test: TestType<any, any>, scenarios: T[], testFn: (scenario: T) => void): void {
    const active: T[] = [];
    for (const scenario of scenarios) {
        if (scenario.skip) {
            const reason = scenario.skipReason ?? "Omitido por configuracin en JSON";

            // eslint-disable-next-line playwright/no-skipped-test
            test.describe.skip(`Escenario: ${scenario.description}`, () => {
                // eslint-disable-next-line playwright/expect-expect
                test(`Omitido: ${reason}`, async () => {});
            });

            continue;
        }
        scenario.metadata = scenario.metadata ?? { testScope: "regression" };
        active.push(scenario);
    }

    const groups = new Map<string, T[]>();
    for (const scenario of active) {
        const key = buildGroupKey(scenario);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(scenario);
    }

    for (const [groupKey, groupScenarios] of groups) {
        const representativeScenario = groupScenarios[0];
        const useConfig = buildGroupUseConfig(representativeScenario);

        test.describe(`Grupo [${groupKey}]`, () => {
            if (Object.keys(useConfig).length > 0) {
                // By bypassing the type check, we allow dynamic injection of fixtures.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion
                test.use(useConfig as any);
            }

            for (const scenario of groupScenarios) {
                const metadata = scenario.metadata!;
                const executionTag = `@${metadata.testScope}`;
                
                // We disable the 'valid-describe-callback' rule here because ESLint statically expects
                // an inline arrow function, but we are safely passing our callback via the 'fn' parameter
                // to dynamically route between .only and normal execution without duplicating code.
                /* eslint-disable playwright/valid-describe-callback */
                const runDescribe = scenario.only 
                    ? (title: string, fn: () => void) => test.describe.only(title, fn)
                    : (title: string, fn: () => void) => test.describe(title, fn);
                /* eslint-enable playwright/valid-describe-callback */

                const prefixContent: string[] = [];
                if (metadata.ws) prefixContent.push(Array.isArray(metadata.ws) ? metadata.ws.join(", ") : metadata.ws);
                if (scenario.id) prefixContent.push(scenario.id);
                const prefix = prefixContent.length > 0 ? `[${prefixContent.join(' - ')}] ` : '';
                
                runDescribe(`Escenario: ${prefix}${scenario.description} ${executionTag}`, () => {
                    if (metadata.ws) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
                        annotateTicket(test as any, metadata);
                    }

                    const scenarioOptions: Record<string, unknown> = {};
                    if ('subsidiaryName' in scenario && scenario.subsidiaryName) scenarioOptions.subsidiaryName = scenario.subsidiaryName;
                    if ('subsidiaryCode' in scenario && scenario.subsidiaryCode) scenarioOptions.subsidiaryCode = scenario.subsidiaryCode;
                    if ('openingAmount' in scenario && scenario.openingAmount) scenarioOptions.openingAmount = scenario.openingAmount;
                    if (scenario.authType) scenarioOptions.authType = scenario.authType;
                    if (scenario.loginMode) scenarioOptions.loginMode = scenario.loginMode;
                    if ('forceBusinessType' in scenario && scenario.forceBusinessType) scenarioOptions.forceBusinessType = scenario.forceBusinessType;
                    if ('dispatchEnabled' in scenario && scenario.dispatchEnabled !== undefined) scenarioOptions.dispatchEnabled = scenario.dispatchEnabled;
                    if ('cashRegisterMode' in scenario && scenario.cashRegisterMode) scenarioOptions.cashRegisterMode = scenario.cashRegisterMode;
                    if ('chefAuthType' in scenario && scenario.chefAuthType) scenarioOptions.chefAuthType = scenario.chefAuthType;
                    if ('restaurantSetupOptions' in scenario && scenario.restaurantSetupOptions) scenarioOptions.restaurantSetupOptions = scenario.restaurantSetupOptions;

                    if (Object.keys(scenarioOptions).length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion
                        test.use(scenarioOptions as any);
                    }

                    testFn(scenario);
                });
            }
        });
    }
}
