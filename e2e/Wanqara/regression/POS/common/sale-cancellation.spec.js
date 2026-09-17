import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { cancelFirstSaleAndVerify } from "../../transactions/sales/harness/cancel-sale-flow.js";
import { PosSaleWorkflow } from "../../../harness/helpers/workflows/pos-sale-workflow.js";
import { test } from "../../../harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cancellation.json"), "utf-8")
);

test.describe("Cancel Sales (POS)", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
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
