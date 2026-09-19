import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type PosScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
interface DeliveryData {
  phone: string;
  clientName: string;
  observation: string;
  cedula: string;
  address: DeliveryAddressOptions;
}
type ScenarioData = PosScenario & {
  productName: string;
  paymentMethod: string;
  chefAuthType: string;
  chefLogin: string;
  chefSubsidiary: string;
  chefSubsidiaryCode: string;
  deliveryData: DeliveryData;
}


import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "delivery-flow.json"), "utf-8"))
);

import {
  addClientFromDeliveryForm,
  ensureDeliveryPhoneAndAddress,
  fillDeliveryAddress,
  fillDeliveryFormInfo,
  openDeliveryModal,
  saveDeliveryForm,
  saveDeliverySelection,
  selectDeliveryMode,
  selectExistingDeliveryAddress,
  verifyDeliveryConfirmed,
  type DeliveryAddressOptions,
} from "./harness/pos-delivery-flow.js";

test.describe.serial("POS Restaurant - Delivery Flow", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    // eslint-disable-next-line playwright/expect-expect
    test("creates or selects a delivery address depending on prior state", async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.info().annotations.push({
        type: "issue",
        description: "https://wanqara-team.atlassian.net/browse/WS-871",
      });
      test.info().annotations.push({
        type: "known_issue",
        description:
          "Si falla por timeout, puede deberse a que las búsquedas de números telefónicos y la asignación de clientes no son óptimas, generando lag en el sistema tras uso prolongado.",
      });

      test.setTimeout(180_000);

      const modal = await test.step("Open delivery modal", async () => {
        return await openDeliveryModal(page);
      });

      await test.step("Select delivery mode", async () => {
        await selectDeliveryMode(page, modal);
      });

      const { form, isNew } = await test.step("Ensure phone and detect address state", async () => {
        return await ensureDeliveryPhoneAndAddress(page, modal, scenario.deliveryData.phone);
      });

      // This is a dynamic robust test that handles both new and existing customer flows based on state.
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (isNew) {
        await test.step("Fill delivery contact info", async () => {
          await fillDeliveryFormInfo(page, form!, {
            clientName: scenario.deliveryData.clientName,
            observation: scenario.deliveryData.observation,
          });
        });

        await test.step("Add and save client from delivery form", async () => {
          await addClientFromDeliveryForm(page, form!, {
            cedula: scenario.deliveryData.cedula,
          });
        });

        await test.step("Fill address details", async () => {
          await fillDeliveryAddress(page, form!, scenario.deliveryData.address);
        });

        await test.step("Save new delivery and verify success", async () => {
          await saveDeliveryForm(page);
        });

        await test.step("Select the newly created address card", async () => {
          await selectExistingDeliveryAddress(page);
        });

        await test.step("Save delivery selection", async () => {
          await saveDeliverySelection(page);
        });
      } else {
        await test.step("Select existing address card", async () => {
          await selectExistingDeliveryAddress(page);
        });

        await test.step("Save delivery selection", async () => {
          await saveDeliverySelection(page);
        });
      }

      await test.step("Verify delivery confirmed in panel", async () => {
        await verifyDeliveryConfirmed(page);
      });
    });
  });
});
