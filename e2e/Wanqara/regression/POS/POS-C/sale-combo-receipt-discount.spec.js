import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale, selectDocumentTypePos } from "../harness/sales/pos-checkout-helpers.js";
import { applyGeneralDiscount } from "../harness/financials/pos-financial-assertions.js";
import { test } from "../../../harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-combo-receipt-discount.json"), "utf-8")
);

test.describe("POS Sale - Combo con Recibo y Descuento", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    
    test(`Vender un producto combo con recibos y descuento`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(120_000);

      await test.step("Seleccionar tipo de documento", async () => {
        await selectDocumentTypePos(page, scenario.documentType);
      });

      await test.step("Agregar producto combo", async () => {
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: null });
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
