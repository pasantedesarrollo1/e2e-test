/* eslint-disable */
import { test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";

import { AdminSaleWorkflow, PreSaleStrategy } from "@/e2e/Wanqara/harness/helpers/workflows/admin-sale-workflow.js";

import scenariosRaw from "./0-json-data/admin-pre-sale-dispatch.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(scenariosRaw);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

interface MixedCartItem {
  name: string;
  productMode?: string;
}

interface SaleParams {
  documentType: string;
  clientCedula: string;
  identityType?: string;
  paymentMethod: string;
  mixedCart: MixedCartItem[];
}

type ScenarioData = AdminScenario & {
  authType: string;
  saleParams: SaleParams;
}


test.describe("Admin Pre-Sales - Mixed Cart / Dispatch Logic", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes an admin pre-sale with mixed cart (focus)" : "Completes an admin pre-sale with mixed cart",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Create Admin Pre-Sale with Mixed Cart", async () => {
          await new AdminSaleWorkflow(page, new PreSaleStrategy())
            .withAuth(scenario.authType)
            .withDocumentType(scenario.saleParams.documentType)
            .withClient(scenario.saleParams.clientCedula)
            .withMixedCart(scenario.saleParams.mixedCart as any, { isPreSale: true })
            .withPaymentMethod(scenario.saleParams.paymentMethod)
            .execute();
        });
      }
    );
  });
});
