import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials } from "../../../harness/config/settings.js";
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
import { getSessionPath } from "../../../harness/helpers/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-product-options.json"), "utf-8")
);


async function applyProductOptions(page, { priceLabel, discountType, optionsParams }) {
  const dialog = await openProductOptions(page);
  await setQuantityInOptions(page, dialog, optionsParams.quantity);
  await selectPriceType(page, dialog, priceLabel);
  await setUnitPriceInOptions(page, dialog, optionsParams.unitPrice);
  await setDiscountInOptions(page, dialog, optionsParams.discountRate, discountType);
  await saveProductOptions(page, dialog);
}

async function assertCartHasProduct(page) {
  await expect(
    page.locator(".v-card").filter({ hasText: /Precio Total/i }).first()
  ).toBeVisible();
}

for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Product Options @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    const runTest = (title, bodyFn) => {
      if (scenario.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    runTest("validates product options modal for all price type and discount type combinations", async (page) => {
      test.setTimeout(120_000);

      await test.step("Add product to the cart", async () => {
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: null });
      });

      await test.step("Apply options: Precio A with Porcentaje discount", async () => {
        await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Porcentaje", optionsParams: scenario.productOptionsParams });
        await assertCartHasProduct(page);
      });

      await test.step("Apply options: Precio C with Porcentaje discount", async () => {
        await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Porcentaje", optionsParams: scenario.productOptionsParams });
        await assertCartHasProduct(page);
      });

      await test.step("Apply options: Precio A with Fijo discount", async () => {
        await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Fijo", optionsParams: scenario.productOptionsParams });
        await assertCartHasProduct(page);
      });

      await test.step("Apply options: Precio C with Fijo discount and complete the sale", async () => {
        await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Fijo", optionsParams: scenario.productOptionsParams });

        const finishButton = page.getByRole("button", { name: /Terminar Venta/i });
        await finishButton.click();

        await page.waitForURL(new RegExp(scenario.paymentUrlPattern));
        await completePayment(page);
      });
    });
  });
}
