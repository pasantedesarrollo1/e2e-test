/* eslint-disable */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
interface DeliveryData {
  phone: string;
  clientName: string;
  observation: string;
  cedula: string;
  address: any;
}
interface ScenarioData extends ScenarioDefinition, TestMetadata {
  description: string;
  metadata?: any;
  openingAmount: string;
  authType: string;
  loginMode?: "fresh" | "cached" | "";
  subsidiaryName: string;
  subsidiaryCode: string;
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
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "delivery-flow.json"), "utf-8")
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
} from "./harness/pos-delivery-flow.js";

test.describe.serial("POS Restaurant - Delivery Flow", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
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
        await selectDeliveryMode(page, modal!);
      });

      const { form, isNew } = await test.step("Ensure phone and detect address state", async () => {
        return await ensureDeliveryPhoneAndAddress(page, modal!, scenario.deliveryData.phone);
      });

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
          await fillDeliveryAddress(page, form!, scenario.deliveryData.address as any);
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
