import { test as posTest } from "../../../harness/fixtures/pos.fixture.js";
import { test as stageTest } from "../../../harness/fixtures/stage.fixture.js";
import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "pos-cross-sales.json"), "utf-8")
);

const retailScenarios = scenarios.filter(s => s.type === 'retail-sale');
const restaurantScenarios = scenarios.filter(s => s.type === 'restaurant-flow');

posTest.describe("POS Retail Cross Sales", () => {
  generateDataDrivenTests(posTest, retailScenarios, (scenario) => {
    posTest(scenario.description, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      posTest.setTimeout(120_000);
      
      await posTest.step("Realizar venta retail cruzada", async () => {
        await selectClientByCedula(page, scenario.saleParams.clientCedula);
        await searchAndSelectProduct(page, { name: scenario.saleParams.productName, searchTerm: null });
        
        await page.getByRole("button", { name: /Terminar Venta/i }).click();

        await completePayment(page, {
          paymentMethod: scenario.saleParams.paymentMethod?.label || scenario.paymentMethod,
          printTicket: scenario.saleParams.printTicket ?? false,
          openDrawer: scenario.saleParams.openDrawer ?? false
        });
      });
    });
  });
});

stageTest.describe("POS Restaurant Cross Sales", () => {
  generateDataDrivenTests(stageTest, restaurantScenarios, (scenario) => {
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
