import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { expect, test } from "../../../harness/builders/pos.builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-inventory-dispatch.json"), "utf-8")
);

import { completePayment } from "../harness/payments/pos-payment.js";
import { selectFirstSerie, selectFirstVariant } from "../harness/products/pos-products.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from '../harness/sales/pos-checkout-helpers.js';

const CALLBACK_MAP = {
  selectFirstVariant,
  selectFirstSerie
};

async function executeSales(page, { products, paymentMethod }) {
  for (const product of products) {
    const afterProductSelect = product.afterSelectCallback ? CALLBACK_MAP[product.afterSelectCallback] : null;
    await test.step(`Sale [${product.type}] - ${product.name}`, async () => {
      await expect(page).toHaveURL(/\/pos\/(home|restaurant-home)/);
      await searchAndSelectProduct(page, { name: product.name, searchTerm: null });
      if (afterProductSelect) {
        await afterProductSelect(page);
      }
      await clickFinishSale(page);
      await completePayment(page, { paymentMethod });
    });
  }
}

test.describe.serial("POS Retail - Sale Inventory Dispatch", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {
    test(`completes multiple sales seamlessly with dispatch ${scenario.dispatchEnabled ? 'enabled' : 'disabled'}`, async ({ posPage: page }) => {
      test.setTimeout(180_000);
      
      await executeSales(page, {
        products: scenario.products,
        paymentMethod: scenario.paymentMethod
      });
    });
  });
});
