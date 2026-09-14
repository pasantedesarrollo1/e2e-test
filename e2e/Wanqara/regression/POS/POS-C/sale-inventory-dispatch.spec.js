import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { test, expect } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-inventory-dispatch.json"), "utf-8")
);

import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { ensureCashRegisterOpen } from "../harness/cash-register/cash-register-helpers.js";
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

for (const scenario of scenarios) {
  test.describe(`POS Retail - ${scenario.description} @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType),
        subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode,
      openingAmount: scenario.openingAmount });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test(`completes multiple sales seamlessly with dispatch ${scenario.dispatchEnabled ? 'enabled' : 'disabled'}`, async ({ page }) => {
      test.setTimeout(180_000);
      
      await ensureAuthenticated(page, { targetPath: "/pos/home" });
      await ensureCashRegisterOpen(page, scenario.openingAmount, scenario.subsidiaryName, scenario.subsidiaryCode, scenario.authType);
      await page.waitForURL(/\/pos\/(home|restaurant-home)/);

      await executeSales(page, {
        products: scenario.products,
        paymentMethod: scenario.paymentMethod
      });
    });
  });
}
