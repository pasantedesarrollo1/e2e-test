/* eslint-disable */

import fs from "fs";
interface DiscountCase {
  product: any;
  requiresClient?: any;
  precision: any;
  precisionHoliday: any;
}
interface SurchargeProduct {
  type: string;
}
type ScenarioData = PosScenario & {
  discountName?: string;
  discountCases?: DiscountCase[];
  paymentMethod: string;
  surchargeName?: string;
  surchargeProducts?: SurchargeProduct[];
  surchargePrecision?: any;
  surchargePrecisionHoliday?: any;
}

import path from "path";
import { fileURLToPath } from "url";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/shared/client-picker.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type PosScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import {
  applyGeneralDiscount,
  applyManualSurcharge,
  assertSalePanelUI,
  finalizeSaleAndAssert,
  runFinancialPrecisionFlow,
} from "@/e2e/Wanqara/regression/POS/harness/financials/pos-financial-assertions.js";
import { selectFirstSerie, selectFirstVariant } from "@/e2e/Wanqara/regression/POS/harness/products/pos-products.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import type { Page } from "@playwright/test";
import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-financial-precision.json"), "utf-8"))
);

const functionMap = {
  selectFirstVariant,
  selectFirstSerie
};

async function runAllProductsSurchargeFlow(page: Page, { productsToAdd, precision, precisionHoliday, requiresClient, surchargeName, paymentMethod }: any) {
  await test.step(`Assign customer [${requiresClient}]`, async () => {
    await selectClientByCedula(page, requiresClient);
  });

  for (const { product, afterSelect } of productsToAdd) {
    await test.step(`Add product: ${product.name}`, async () => {
      await searchAndSelectProduct(page, { name: product.name, searchTerm: undefined });
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
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    
    for (const { product, requiresClient, precision, precisionHoliday } of scenario.discountCases!) {
      test(`validates financial calculations for [${product.type}] with ${scenario.discountName}`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
        test.setTimeout(120_000);

        await runFinancialPrecisionFlow(page, {
          product,
          requiresClient,
          applyModifier: (page) => applyGeneralDiscount(page, "3.3337373372323"),
          precision,
          precisionHoliday,
          paymentMethod: scenario.paymentMethod
        });
      });
    }

    test(`validates financial calculations for ${scenario.surchargeName} across compatible product types in a single sale`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);

      const mappedSurchargeProducts = scenario.surchargeProducts!.map((sp: SurchargeProduct) => ({
        product: { type: (sp as any).productType, name: (sp as any).productName },
        afterSelect: (sp as any).afterSelectFn ? (functionMap as any)[(sp as any).afterSelectFn] : null
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
