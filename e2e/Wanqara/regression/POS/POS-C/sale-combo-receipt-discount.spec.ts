import fs from "fs";
interface ScenarioData extends FlatScenario {
  documentType: string;
  productName: string;
  discountValue: string;
  paymentMethod: string;
}

import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { clickFinishSale, selectDocumentTypePos } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";
import { applyGeneralDiscount } from "@/e2e/Wanqara/regression/POS/harness/financials/pos-financial-assertions.js";
import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-combo-receipt-discount.json"), "utf-8"))
);

test.describe("POS Sale - Combo con Recibo y Descuento", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    
    test(`Vender un producto combo con recibos y descuento`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(120_000);

      await test.step("Seleccionar tipo de documento", async () => {
        await selectDocumentTypePos(page, scenario.documentType);
      });

      await test.step("Agregar producto combo", async () => {
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: undefined });
      });

      await test.step("Aplicar descuento general", async () => {
        await applyGeneralDiscount(page, scenario.discountValue);
      });

      await test.step("Finalizar venta", async () => {
        await clickFinishSale(page);
      });

      await test.step("Completar pago", async () => {
        await completePayment(page, { paymentMethod: scenario.paymentMethod });
      });
    });

  });
});
