import { test } from "../harness/pos-fixtures.js";
import { requirePosCredentials } from "../../../harness/settings.js";
import { SEED } from "../../../harness/seed.js";
import { selectClientByCedula } from "../harness/pos-sale-flow.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { selectFirstVariant, selectFirstSerie } from "../harness/pos-products.js";
import { getSessionPath } from "../../../harness/auth.js";
import {
  PRECISION_CASES,
  applyGeneralDiscount,
  applyManualSurcharge,
  assertSalePanelUI,
  finalizeSaleAndAssert,
  runFinancialPrecisionFlow,
} from "../harness/pos-financial-assertions.js";

async function runAllProductsSurchargeFlow(page, { productsToAdd, precision, precisionHoliday, requiresClient }) {
  await test.step(`Assign customer [${requiresClient}]`, async () => {
    await selectClientByCedula(page, requiresClient);
  });

  for (const { product, afterSelect } of productsToAdd) {
    await test.step(`Add product: ${product.name}`, async () => {
      await searchAndSelectProduct(page, { name: product.name, searchTerm: null });
      if (afterSelect) await afterSelect(page);
    });
  }

  await test.step(`Apply ${SEED.surcharge.name}`, async () => {
    await applyManualSurcharge(page);
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
    await finalizeSaleAndAssert(page, { precision: activePrecision, multiProduct: true });
  });
}

const environments = [
  { 
    name: 'Retail', 
    authType: 'retail', 
    fixture: 'posPage',
    surchargeProducts: [
      { product: SEED.products.tallaColor,   afterSelect: selectFirstVariant },
      { product: SEED.products.serie,        afterSelect: selectFirstSerie   },
      { product: SEED.products.servicio,     afterSelect: null               },
      { product: SEED.products.elaborado,    afterSelect: null               },
      { product: SEED.products.combo,        afterSelect: null               },
      { product: SEED.products.estandar,     afterSelect: null               },
      { product: SEED.products.preElaborado, afterSelect: null               },
      { product: SEED.products.subproducto,  afterSelect: null               },
    ],
    surchargePrecision: SEED.surcharge.precision.allProducts,
    surchargePrecisionHoliday: SEED.surcharge.precisionHoliday?.allProducts
  },
  { 
    name: 'Restaurant', 
    authType: 'restaurant', 
    fixture: 'posRestaurantPage',
    surchargeProducts: [
      { product: SEED.products.servicio,     afterSelect: null },
      { product: SEED.products.elaborado,    afterSelect: null },
      { product: SEED.products.combo,        afterSelect: null },
      { product: SEED.products.estandar,     afterSelect: null },
      { product: SEED.products.preElaborado, afterSelect: null },
      { product: SEED.products.subproducto,  afterSelect: null },
    ],
    surchargePrecision: SEED.surcharge.precision.restaurantProducts,
    surchargePrecisionHoliday: SEED.surcharge.precisionHoliday?.restaurantProducts
  }
];

for (const env of environments) {
  const runTest = (title, bodyFn) => {
    if (env.fixture === 'posPage') {
      test(title, async ({ posPage: page }) => await bodyFn(page));
    } else {
      test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
    }
  };

  test.describe(`POS ${env.name} — Financial Calculation Accuracy with ${SEED.discount.name} @regression`, () => {
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(env.authType) });

    for (const { key, product, afterProductSelect } of PRECISION_CASES) {
      runTest(`validates financial calculations for [${product.type}] with a general discount`, async (page) => {
        test.setTimeout(120_000);

        await runFinancialPrecisionFlow(page, {
          product,
          afterProductSelect,
          applyModifier: applyGeneralDiscount,
          precision: SEED.discount.precision[key],
          precisionHoliday: SEED.discount.precisionHoliday
            ? SEED.discount.precisionHoliday[key]
            : undefined,
        });
      });
    }
  });

  test.describe(`POS ${env.name} — Financial Calculation Accuracy with ${SEED.surcharge.name} @regression`, () => {
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(env.authType) });

    runTest("validates financial calculations for a manual surcharge across compatible product types in a single sale", async (page) => {
      test.setTimeout(180_000);

      await runAllProductsSurchargeFlow(page, {
        productsToAdd: env.surchargeProducts,
        precision: env.surchargePrecision,
        precisionHoliday: env.surchargePrecisionHoliday,
        requiresClient: SEED.clients.consumidorFinal.cedula,
      });
    });
  });
}