import { annotateTicket } from "@/e2e/Wanqara/harness/helpers/reporting/annotate.js";
import { getSessionPath } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import type { TestType } from "@playwright/test";

import type { 
  ScenarioDefinition, 
  TestMetadata, 
  StageSetupOrderOptions, 
  StageSetupOptions 
} from "@/e2e/Wanqara/harness/types/scenarios.types.js";

export type { ScenarioDefinition, TestMetadata };

// Tipo auxiliar para specs que usan generateDataDrivenTests sin discriminar por fixture
export type FlatScenario = {
  id?: string;
  description: string;
  skip?: boolean;
  skipReason?: string;
  only?: boolean;
  metadata?: TestMetadata;
  authType?: string;
  loginMode?: 'fresh' | 'cached' | '';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  openingAmount?: string;
  businessType?: string;
  dispatchEnabled?: boolean;
  cashRegisterMode?: string;
  chefAuthType?: string;
  stageSetupOptions?: StageSetupOrderOptions | StageSetupOptions | null;
  [key: string]: unknown;
};

function buildGroupKey(scenario: FlatScenario): string {
    const scope = scenario.metadata?.testScope ?? "regression";
    const loginMode = scenario.loginMode ?? (scope === "release" ? "fresh" : "cached");
    const authType = scenario.authType ?? "anonymous";
    return `${loginMode}::${authType}`;
}


function buildGroupUseConfig(scenario: FlatScenario): Record<string, unknown> {
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

export function generateDataDrivenTests<T extends FlatScenario, Fixtures extends Record<string, any>>(test: TestType<Fixtures, any>, scenarios: T[], testFn: (scenario: T) => void): void {
    const active: T[] = [];
    for (const scenario of scenarios) {
        if (scenario.skip) {
            const reason = scenario.skipReason ?? "Omitido por configuración en JSON";

            test.describe.skip(`Escenario: ${scenario.description}`, () => {
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                test.use(useConfig as any);
            }

            for (const scenario of groupScenarios) {
                const metadata = scenario.metadata!;
                const executionTag = `@${metadata.testScope}`;
                const describeBlock = scenario.only ? test.describe.only : test.describe;

                const prefixContent: string[] = [];
                if (metadata.ws) prefixContent.push(Array.isArray(metadata.ws) ? metadata.ws.join(", ") : metadata.ws);
                if (scenario.id) prefixContent.push(scenario.id);
                const prefix = prefixContent.length > 0 ? `[${prefixContent.join(' - ')}] ` : '';
                
                describeBlock(`Escenario: ${prefix}${scenario.description} ${executionTag}`, () => {
                    if (metadata.ws) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        annotateTicket(test as any, metadata);
                    }

                    const scenarioOptions: Record<string, unknown> = {};
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        test.use(scenarioOptions as any);
                    }

                    testFn(scenario);
                });
            }
        });
    }
}
