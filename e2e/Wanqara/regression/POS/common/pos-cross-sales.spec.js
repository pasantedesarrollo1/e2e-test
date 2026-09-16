import { test as posTest } from "../../../harness/builders/pos.builder.js";
import { test as stageTest } from "../../../harness/builders/stage.builder.js";
import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { openAndSelectOrder } from "../POS-R/harness/pos-orders-common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "pos-cross-sales.json"), "utf-8")
);

const retailScenarios = scenarios.filter(s => s.type === 'retail-sale');
const restaurantScenarios = scenarios.filter(s => s.type === 'restaurant-flow');

posTest.describe("POS Retail Cross Sales", () => {
  generateDataDrivenTests(posTest, retailScenarios, (scenario) => {
    posTest(scenario.description, async ({ posPage: page }) => {
      posTest.setTimeout(120_000);
      
      await posTest.step("Realizar venta retail cruzada", async () => {
        await selectClientByCedula(page, scenario.saleParams.clientCedula);
        await searchAndSelectProduct(page, { name: scenario.saleParams.productName, searchTerm: null });
        
        await page.getByRole("button", { name: /Terminar Venta/i }).click();

        // Completar pago
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
    stageTest(scenario.description, async ({ stageSetup }) => {
      stageTest.setTimeout(180_000);
      const { posPage: page, stageContext } = stageSetup;
      
      await stageTest.step("Cobrar orden generada por el chef", async () => {
        // El builder stageSetup ya creó la orden en la cocina (stageContext.activeTableName),
        // regresó al POS y la abrió automáticamente.
        
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
