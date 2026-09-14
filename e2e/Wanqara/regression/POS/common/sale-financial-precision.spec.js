import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from '../../../harness/helpers/people/client-helpers.js';
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import {
  applyGeneralDiscount,
  applyManualSurcharge,
  assertSalePanelUI,
  finalizeSaleAndAssert,
  runFinancialPrecisionFlow,
} from "../harness/financials/pos-financial-assertions.js";
import { selectFirstSerie, selectFirstVariant } from "../harness/products/pos-products.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { test } from "../harness/setup/pos-fixtures.js";

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

test.describe.serial("Financial Calculation Accuracy", () => {
  for (const scenario of scenarios) {
    

    const runTest = (title, bodyFn) => {
      if (scenario.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    test.describe(`POS ${scenario.description} - Financial Calculation Accuracy with ${scenario.discountName} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType),
        subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode,
      openingAmount: scenario.openingAmount });
      
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      for (const { product, afterProductSelect, precision, precisionHoliday } of scenario.discountCases) {
        runTest(`validates financial calculations for [${product.type}] with a general discount`, async (page) => {
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
    });

    test.describe(`POS ${scenario.description} - Financial Calculation Accuracy with ${scenario.surchargeName} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType),
        subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode,
      openingAmount: scenario.openingAmount });

      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      runTest("validates financial calculations for a manual surcharge across compatible product types in a single sale", async (page) => {
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
  }
});
