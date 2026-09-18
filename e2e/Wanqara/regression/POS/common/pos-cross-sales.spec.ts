/* eslint-disable */
import { test as posTest } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";
interface SaleParams {
  clientCedula: string;
  productName: string;
  paymentMethod?: any;
  printTicket?: boolean;
  openDrawer?: boolean;
}
interface ScenarioData extends FlatScenario {
  saleParams: SaleParams;
  paymentMethod?: string;
  checkoutName?: string;
}

import { test as stageTest } from "@/e2e/Wanqara/harness/fixtures/stage.fixture.js";
import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "pos-cross-sales.json"), "utf-8"))
);

const retailScenarios = scenarios.filter((s: any) => s.type === 'retail-sale');
const restaurantScenarios = scenarios.filter((s: any) => s.type === 'restaurant-flow');

posTest.describe("POS Retail Cross Sales", () => {
  generateDataDrivenTests<ScenarioData, any>(posTest, retailScenarios, (scenario: ScenarioData) => {
    posTest(scenario.description, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      posTest.setTimeout(120_000);
      
      await posTest.step("Realizar venta retail cruzada", async () => {
        await selectClientByCedula(page, scenario.saleParams.clientCedula);
        await searchAndSelectProduct(page, { name: scenario.saleParams.productName, searchTerm: undefined });
        
        await page.getByRole("button", { name: /Terminar Venta/i }).click();

        await completePayment(page, {
          paymentMethod: (scenario.saleParams.paymentMethod as any)?.label || scenario.paymentMethod,
          printTicket: scenario.saleParams.printTicket ?? false,
          openDrawer: scenario.saleParams.openDrawer ?? false
        });
      });
    });
  });
});

stageTest.describe("POS Restaurant Cross Sales", () => {
  generateDataDrivenTests<ScenarioData, any>(stageTest, restaurantScenarios, (scenario: ScenarioData) => {
    stageTest(scenario.description, async ({ stageEnvironment }) => {
      stageTest.setTimeout(180_000);
      const { page } = stageEnvironment;
      
      await stageTest.step("Cobrar orden generada por el chef", async () => {
        
        const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar pago/i }).first();
        await cobrarBtn.click();
        
        await selectClientByCedula(page, scenario.saleParams.clientCedula);
        
        await page.getByRole("button", { name: /Terminar Venta/i }).click();
        await page.waitForURL(/\/pos\/restaurant-payments/);

        const response = await completePayment(page, {
          paymentMethod: scenario.paymentMethod,
          printTicket: scenario.saleParams.printTicket ?? false,
          openDrawer: scenario.saleParams.openDrawer ?? false
        });

        const payload = response.request().postDataJSON();
        expect(payload.subsidiary).toBeDefined();
        
        if (payload.subsidiary?.open_cash_register?.checkout?.subsidiary_id) {
          expect(
            payload.subsidiary.id,
            `CROSSMATCH DETECTED IN POS: Subsidiary (${payload.subsidiary.id}) vs Cash Register (${payload.subsidiary.open_cash_register.checkout.subsidiary_id})`
          ).toBe(payload.subsidiary.open_cash_register.checkout.subsidiary_id);
        }
      });
    });
  });
});
