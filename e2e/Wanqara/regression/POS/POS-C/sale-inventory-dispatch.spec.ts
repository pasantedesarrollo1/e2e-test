
/* eslint-disable */
import fs from "fs";
interface ScenarioData extends ScenarioDefinition, TestMetadata {
  dispatchEnabled: boolean;
  products: any[];
  paymentMethod: string;
}

import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-inventory-dispatch.json"), "utf-8")
);

import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { selectFirstSerie, selectFirstVariant } from "@/e2e/Wanqara/regression/POS/harness/products/pos-products.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { clickFinishSale } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";

const CALLBACK_MAP = {
  selectFirstVariant,
  selectFirstSerie
};

async function executeSales(page: Page, { products, paymentMethod }: any) {
  for (const product of products) {
    const afterProductSelect = product.afterSelectCallback ? (CALLBACK_MAP as any)[product.afterSelectCallback] : null;
    await test.step(`Sale [${product.type}] - ${product.name}`, async () => {
      await expect(page).toHaveURL(/\/pos\/(home|restaurant-home)/);
      await searchAndSelectProduct(page, { name: product.name, searchTerm: undefined });
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

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    test(`completes multiple sales seamlessly with dispatch ${scenario.dispatchEnabled ? 'enabled' : 'disabled'}`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);
      
      await executeSales(page, {
        products: scenario.products,
        paymentMethod: scenario.paymentMethod
      });
    });
  });
});
