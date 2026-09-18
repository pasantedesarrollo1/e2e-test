/* eslint-disable */
import fs from "fs";
interface ProductOptionsParams {
  productName: string;
  paymentMethod: string;
  [key: string]: any;
}
interface ScenarioData extends ScenarioDefinition, TestMetadata {
  productOptionsParams: ProductOptionsParams;
}

import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import {
  openProductOptions,
  saveProductOptions,
  selectPriceType,
  setDiscountInOptions,
  setQuantityInOptions,
  setUnitPriceInOptions,
} from "@/e2e/Wanqara/regression/POS/harness/products/pos-product-options.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-product-options.json"), "utf-8")
);

async function applyProductOptions(page: Page, { priceLabel, discountType, optionsParams }: any) {
  const dialog = await openProductOptions(page);
  await setQuantityInOptions(page, dialog, optionsParams.quantity);
  await selectPriceType(page, dialog, priceLabel);
  await setUnitPriceInOptions(page, dialog, optionsParams.unitPrice);
  await setDiscountInOptions(page, dialog, optionsParams.discountRate, discountType);
  await saveProductOptions(page, dialog);
}

async function assertCartHasProduct(page: Page) {
  await expect(
    page.locator(".v-card").filter({ hasText: /Precio Total/i }).first()
  ).toBeVisible();
}

test.describe("Product Options", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    
    test("validates product options modal for all price type and discount type combinations", async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(120_000);

      await test.step("Add product to the cart", async () => {
        await searchAndSelectProduct(page, { name: scenario.productOptionsParams.productName, searchTerm: undefined });
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

        await page.waitForURL(/\/pos\/(restaurant-)?payments/);
        await completePayment(page, { paymentMethod: scenario.productOptionsParams.paymentMethod });
      });
    });

  });
});
