import { test } from "../../regression/harness/pos-fixtures.js";
import { requirePosCredentials } from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import { selectClientByCedula } from "../../regression/harness/pos-sale-flow.js";
import { searchAndSelectProduct } from "../../regression/harness/pos-search.js";
import {
  PRECISION_CASES,
  applyGeneralDiscount,
  applyManualSurcharge,
  assertSalePanelUI,
  finalizeSaleAndAssert,
  runFinancialPrecisionFlow,
} from "../../regression/harness/pos-financial-assertions.js";

async function runAllProductsSurchargeFlow(page, { precision, precisionHoliday, requiresClient }) {
  const productsToAdd = [
    { product: SEED.products.servicio,     afterSelect: null },
    { product: SEED.products.elaborado,    afterSelect: null },
    { product: SEED.products.combo,        afterSelect: null },
    { product: SEED.products.estandar,     afterSelect: null },
    { product: SEED.products.preElaborado, afterSelect: null },
    { product: SEED.products.subproducto,  afterSelect: null },
  ];

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

test.describe(`POS Restaurant — Financial Calculation Accuracy with ${SEED.discount.name} @release`, () => {
  requirePosCredentials(test);

  for (const { key, product, afterProductSelect } of PRECISION_CASES) {
    test(`validates financial calculations for [${product.type}] with a general discount`, async ({ posRestaurantPage: page }) => {
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

test.describe(`POS Restaurant — Financial Calculation Accuracy with ${SEED.surcharge.name} @release`, () => {
  requirePosCredentials(test);

  test("validates financial calculations for a manual surcharge across compatible product types in a single sale", async ({ posRestaurantPage: page }) => {
    test.setTimeout(180_000);

    await runAllProductsSurchargeFlow(page, {
      precision: SEED.surcharge.precision.restaurantProducts,
      precisionHoliday: SEED.surcharge.precisionHoliday?.restaurantProducts,
      requiresClient: SEED.clients.consumidorFinal.cedula,
    });
  });
});