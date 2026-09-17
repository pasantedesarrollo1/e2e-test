import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { selectClientByCedula } from '../../../harness/helpers/people/client-helpers.js';
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import {
  applyGeneralDiscount,
  applyManualSurcharge,
  assertSalePanelUI,
  finalizeSaleAndAssert,
  runFinancialPrecisionFlow,
} from "../harness/financials/pos-financial-assertions.js";
import { selectFirstSerie, selectFirstVariant } from "../harness/products/pos-products.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { test } from "../../../harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-financial-precision.json"), "utf-8")
);

const functionMap = {
  selectFirstVariant,
  selectFirstSerie
};

async function runAllProductsSurchargeFlow(page, { productsToAdd, precision, precisionHoliday, requiresClient, surchargeName, paymentMethod }) {
  await test.step(`Assign customer [${requiresClient}]`, async () => {
    await selectClientByCedula(page, requiresClient);
  });

  for (const { product, afterSelect } of productsToAdd) {
    await test.step(`Add product: ${product.name}`, async () => {
      await searchAndSelectProduct(page, { name: product.name, searchTerm: null });
      if (afterSelect) await afterSelect(page);
    });
  }

  await test.step(`Apply ${surchargeName}`, async () => {
    await applyManualSurcharge(page, '3.3337373372323');
  });

  let activePrecision = precision;
  if (precisionHoliday) {
    const isHoliday = await page.getByText("IVA DIFERENCIADO APLICADO").isVisible();
    if (isHoliday) {
      activePrecision = precisionHoliday;
    }
  }

  await test.step("Verify the sale summary in the UI", async () => {
    await assertSalePanelUI(page, activePrecision.ui);
  });

  await test.step("Complete the sale and validate financial calculations", async () => {
    await finalizeSaleAndAssert(page, { precision: activePrecision, multiProduct: true, paymentMethod });
  });
}

test.describe("Financial Calculation Accuracy", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    
    // Suite 1: Descuentos Generales (1 test por cada discountCase)
    for (const { product, afterProductSelect, precision, precisionHoliday } of scenario.discountCases) {
      test(`validates financial calculations for [${product.type}] with ${scenario.discountName}`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
        test.setTimeout(120_000);

        await runFinancialPrecisionFlow(page, {
          product,
          afterProductSelect,
          applyModifier: (page) => applyGeneralDiscount(page, "3.3337373372323"),
          precision,
          precisionHoliday,
          paymentMethod: scenario.paymentMethod
        });
      });
    }

    // Suite 2: Recargos Manuales Masivos (1 test con todos los surchargeProducts)
    test(`validates financial calculations for ${scenario.surchargeName} across compatible product types in a single sale`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);

      const mappedSurchargeProducts = scenario.surchargeProducts.map(sp => ({
        product: { type: sp.productType, name: sp.productName },
        afterSelect: sp.afterSelectFn ? functionMap[sp.afterSelectFn] : null
      }));

      await runAllProductsSurchargeFlow(page, {
        productsToAdd: mappedSurchargeProducts,
        precision: scenario.surchargePrecision,
        precisionHoliday: scenario.surchargePrecisionHoliday,
        requiresClient: scenario.surchargeClientCedula,
        surchargeName: scenario.surchargeName,
        paymentMethod: scenario.paymentMethod
      });
    });

  });
});
