import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials } from "../../../harness/settings.js";
import { SEED } from "../../../harness/seed.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { completePayment } from "../harness/pos-payment.js";
import {
  openProductOptions,
  setQuantityInOptions,
  setUnitPriceInOptions,
  setDiscountInOptions,
  selectPriceType,
  saveProductOptions,
} from "../harness/pos-product-options.js";
import { getSessionPath } from "../../../harness/auth.js";

async function applyProductOptions(page, { priceLabel, discountType }) {
  const dialog = await openProductOptions(page);
  await setQuantityInOptions(page, dialog, SEED.sale.productOptionsQuantity);
  await selectPriceType(page, dialog, priceLabel);
  await setUnitPriceInOptions(page, dialog, SEED.sale.productOptionsUnitPrice);
  await setDiscountInOptions(page, dialog, SEED.discount.rate, discountType);
  await saveProductOptions(page, dialog);
}

async function assertCartHasProduct(page) {
  await expect(
    page.locator(".v-card").filter({ hasText: /Precio Total/i }).first()
  ).toBeVisible();
}

const environments = [
  { name: 'Retail',     authType: 'retail',     fixture: 'posPage',           paymentUrl: /\/pos\/payments/ },
  { name: 'Restaurant', authType: 'restaurant', fixture: 'posRestaurantPage', paymentUrl: /\/pos\/restaurant-payments/ }
];

for (const env of environments) {
  test.describe(`POS ${env.name} — Product Options @regression`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(env.authType) });

    const runTest = (title, bodyFn) => {
      if (env.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    runTest("validates product options modal for all price type and discount type combinations", async (page) => {
      test.setTimeout(120_000);

      await test.step("Add product to the cart", async () => {
        await searchAndSelectProduct(page, { name: SEED.products.estandar.name, searchTerm: null });
      });

      await test.step("Apply options: Precio A with Porcentaje discount", async () => {
        await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Porcentaje" });
        await assertCartHasProduct(page);
      });

      await test.step("Apply options: Precio C with Porcentaje discount", async () => {
        await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Porcentaje" });
        await assertCartHasProduct(page);
      });

      await test.step("Apply options: Precio A with Fijo discount", async () => {
        await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Fijo" });
        await assertCartHasProduct(page);
      });

      await test.step("Apply options: Precio C with Fijo discount and complete the sale", async () => {
        await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Fijo" });

        const finishButton = page.getByRole("button", { name: /Terminar Venta/i });
        await finishButton.click();

        await page.waitForURL(env.paymentUrl);
        await completePayment(page);
      });
    });
  });
}