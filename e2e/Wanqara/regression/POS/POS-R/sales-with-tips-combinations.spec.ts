import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/stage.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PrecisionUI {
  subtotal: string;
  impuestos: string;
  tip: string;
  total: string;
  [key: string]: unknown;
}
interface PrecisionCase {
  ui: PrecisionUI;
  summary: Record<string, unknown>;
  root: { additional_tip: string | number };
  [key: string]: unknown;
}
interface ProductsMap {
  estandar: string;
  combo: string;
  servicio: string;
  elaborado: string;
}
interface ScenarioData {
  description: string;
  openingAmount: string;
  authType: string;
  loginMode: 'fresh' | 'cached' | '';
  subsidiaryName: string;
  subsidiaryCode: string;
  chefAuthType?: string;
  chefLogin?: Record<string, unknown>;
  chefSubsidiary?: string;
  chefSubsidiaryCode?: string;
  products: ProductsMap;
  paymentMethod: string;
  tipToType: string;
  case1: PrecisionCase;
  case2: PrecisionCase;
  case3: PrecisionCase;
  case4: PrecisionCase;
  case5: PrecisionCase;
  metadata?: { testScope?: string; ws?: string; [key: string]: unknown };
}

const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sales-with-tips-combinations.json"), "utf-8"))
);

import { applyGeneralDiscount, applyManualSurcharge, assertPaymentModalUI, assertPaymentPayloadPrecision, assertSalePanelUI, assertSummaryPrecision } from "@/e2e/Wanqara/regression/POS/harness/financials/pos-financial-assertions.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { captureSaleMutation, clickFinishSale } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";
import {
  addProductToExistingOrder,
  collectOrder
} from "./harness/pos-orders-common.js";
import {
  confirmOrderSeparation,
  navigateToSeparateOrder,
  selectProductToSeparate,
} from "./harness/pos-separate-order.js";
import { assignTipToSale } from "./harness/pos-tip-helpers.js";


for (const scenario of scenarios) {
  
  test.describe.serial(`POS ${scenario.description} - Direct Sales with Tips @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode
    });

    test("Case 1: Direct Sale with Mix (Standard + Combo + Service) and Tip", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(150_000);
      const precision = scenario.case1;

      await searchAndSelectProduct(page, { name: scenario.products.estandar, searchTerm: undefined });

      await test.step("Add additional products to the cart", async () => {
        await searchAndSelectProduct(page, { name: scenario.products.combo });
        await searchAndSelectProduct(page, { name: scenario.products.servicio });
      });

      await assignTipToSale(page, scenario.tipToType);

      await assertSalePanelUI(page, precision.ui);
      await clickFinishSale(page);
      await assertPaymentModalUI(page, precision.ui);
      
      const requestPromise = captureSaleMutation(page);
      await completePayment(page, { paymentMethod: scenario.paymentMethod });

      const request = await requestPromise;
      const body = request.postDataJSON() as Record<string, any>;
       
      assertSummaryPrecision(body, precision.summary);
       
      expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
       
      assertPaymentPayloadPrecision(body, precision);
    });

    test("Case 2: Direct Sale with General Discount and Tip", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(120_000);
      const precision = scenario.case2;

      await searchAndSelectProduct(page, { name: scenario.products.combo, searchTerm: undefined });

      await test.step("Add another product and apply discount", async () => {
        await searchAndSelectProduct(page, { name: scenario.products.estandar });
        await applyGeneralDiscount(page, "3.3337373372323"); 
      });

      await assignTipToSale(page, scenario.tipToType);

      await assertSalePanelUI(page, precision.ui);
      await clickFinishSale(page);
      await assertPaymentModalUI(page, precision.ui);
      
      const requestPromise = captureSaleMutation(page);
      await completePayment(page, { paymentMethod: scenario.paymentMethod });

      const request = await requestPromise;
      const body = request.postDataJSON() as Record<string, any>;
       
      assertSummaryPrecision(body, precision.summary);
       
      expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
       
      assertPaymentPayloadPrecision(body, precision);
    });

    test("Case 5: Direct Sale with Surcharge and Tip", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(120_000);
      const precision = scenario.case5;

      await searchAndSelectProduct(page, { name: scenario.products.combo, searchTerm: undefined });

      await test.step("Add another product and apply surcharge", async () => {
        await searchAndSelectProduct(page, { name: scenario.products.estandar });
        await applyManualSurcharge(page, "3.3337373372323"); 
      });

      await assignTipToSale(page, scenario.tipToType);

      await assertSalePanelUI(page, precision.ui);
      await clickFinishSale(page);
      await assertPaymentModalUI(page, precision.ui);
      
      const requestPromise = captureSaleMutation(page);
      await completePayment(page, { paymentMethod: scenario.paymentMethod });

      const request = await requestPromise;
      const body = request.postDataJSON() as Record<string, any>;
       
      assertSummaryPrecision(body, precision.summary);
       
      expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
       
      assertPaymentPayloadPrecision(body, precision);
    });
  });

  test.describe.serial(`POS ${scenario.description} - Chef Sales with Tips @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode,
      chefAuthType: scenario.chefAuthType,
      chefLogin: scenario.chefLogin,
      chefSubsidiary: scenario.chefSubsidiary,
      chefSubsidiaryCode: scenario.chefSubsidiaryCode,
      stageSetupOptions: {
        createOrder: { productName: scenario.products.estandar },
        
      }
    });

    test("Case 3: Full Table Payment with Composite Inventory and Tip", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);
      const precision = scenario.case3;

      await test.step("Add recipe products (Elaborated and PreElaborated)", async () => {
        await addProductToExistingOrder(page, scenario.products.elaborado);
      });

      await test.step("Simulate returning to POS cart to assign tip", async () => {
        await collectOrder(page);
        await page.waitForURL(/\/pos\/restaurant-payments/);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();

        const backBtn = page.locator('.payment-topbar-left button').first();
        await backBtn.click();

        await page.waitForURL(/\/pos\/restaurant-home/);
        await expect(page.getByText(scenario.products.elaborado).first()).toBeVisible();
      });

      await assignTipToSale(page, scenario.tipToType);

      await test.step("Assert UI, finalize sale, and check summary precision", async () => {
        await assertSalePanelUI(page, precision.ui);
        await clickFinishSale(page);
        
        await assertPaymentModalUI(page, precision.ui);
        
        const requestPromise = captureSaleMutation(page);
        await completePayment(page, { paymentMethod: scenario.paymentMethod });
        
        const request = await requestPromise;
        const body = request.postDataJSON();
        assertSummaryPrecision(body, precision.summary);
        expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
        assertPaymentPayloadPrecision(body, precision);
      });
    });

    test("Case 4: Separate Check Payment with Tip", async ({ stageEnvironment }) => {
      const { page } = stageEnvironment;
      test.setTimeout(180_000);
      const precision = scenario.case4;

      await test.step("Navigate to separate order screen", async () => {
        await navigateToSeparateOrder(page);
      });

      await test.step("Select a product from the original table to separate it", async () => {
        await selectProductToSeparate(page, scenario.products.estandar);
      });

      await test.step("Confirm separation and return to main POS screen", async () => {
        await confirmOrderSeparation(page);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();
      });

      await assignTipToSale(page, scenario.tipToType);

      await test.step("Assign customer, finish sale and complete payment of separate ticket", async () => {
        await assertSalePanelUI(page, precision.ui);
        await clickFinishSale(page);
        
        await assertPaymentModalUI(page, precision.ui);
        
        const requestPromise = captureSaleMutation(page);
        await completePayment(page, { paymentMethod: scenario.paymentMethod });
        
        const request = await requestPromise;
        const body = request.postDataJSON();
        assertSummaryPrecision(body, precision.summary);
        expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
        assertPaymentPayloadPrecision(body, precision);
      });
    });
  });
}
