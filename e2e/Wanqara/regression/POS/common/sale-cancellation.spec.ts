/* eslint-disable */
import fs from "fs";
interface SaleParams {
  productName: string;
  clientCedula: string;
  paymentMethod: string;
}
interface ScenarioData extends FlatScenario {
  subsidiaryName: string;
  subsidiaryCode: string;
  saleParams: SaleParams;
  expectSwitch?: boolean;
  expectMessage?: boolean;
}

import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { cancelFirstSaleAndVerify } from "@/e2e/Wanqara/regression/transactions/sales/harness/cancel-sale-flow.js";
import { PosSaleWorkflow } from "@/e2e/Wanqara/harness/helpers/workflows/pos-sale-workflow.js";
import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cancellation.json"), "utf-8"))
);

test.describe("Cancel Sales (POS)", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    test(scenario.description, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);

      await test.step("Create POS Sale", async () => {
        await new PosSaleWorkflow(page, scenario.subsidiaryName, scenario.subsidiaryCode)
          .withoutNavigation()
          .withProduct(scenario.saleParams.productName)
          .withClient(scenario.saleParams.clientCedula)
          .withPaymentMethod(scenario.saleParams.paymentMethod)
          .execute();
      });

      await test.step("Cancel POS Sale and Verify Modal", async () => {
        await cancelFirstSaleAndVerify(page, {
          expectSwitch: scenario.expectSwitch,
          expectMessage: scenario.expectMessage,
        });
      });
    });
  });
});
