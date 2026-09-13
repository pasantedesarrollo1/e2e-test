import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getTenantBaseUrl,
  requireChefCredentials,
  requirePosCredentials,
} from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sales-with-tips-combinations.json"), "utf-8")
);

async function withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, actionCallback, orderOptions = {}) {
  await closeAllActiveOrders(page, tenantBaseUrl);
  
  const chefContext = await browser.newContext({ storageState: getSessionPath("chef") });
  const chefPage = await chefContext.newPage();
  const activeTableName = await createChefOrder(chefPage, orderOptions);
  await chefContext.close();

  await navigateToRestaurantPOS(page, tenantBaseUrl);
  await openAndSelectOrder(page, activeTableName);
  await actionCallback(page, activeTableName);
}

import { applyGeneralDiscount, applyManualSurcharge, assertPaymentModalUI, assertPaymentPayloadPrecision, assertSalePanelUI, assertSummaryPrecision } from "../harness/pos-financial-assertions.js";
import { completePayment } from "../harness/pos-payment.js";
import { captureSaleMutation, runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import {
  addProductToExistingOrder,
  closeAllActiveOrders,
  collectOrder,
  createChefOrder,
  navigateToRestaurantPOS,
  openAndSelectOrder
} from "./harness/pos-orders-common.js";
import {
  confirmOrderSeparation,
  navigateToSeparateOrder,
  selectProductToSeparate,
} from "./harness/pos-separate-order.js";
import { assignTipToSale } from "./harness/pos-tip-helpers.js";


for (const scenario of scenarios) {
test.describe.serial(`POS ${scenario.description} - Sale with Tips Combinations @${scenario.metadata?.testScope || 'regression'}`, () => {

  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("Case 1: Direct Sale with Mix (Standard + Combo + Service) and Tip", async ({ page }) => {
    test.setTimeout(150_000);
    const tenantBaseUrl = getTenantBaseUrl();
    const precision = scenario.case1;
    
    const requestPromise = captureSaleMutation(page);

    await runPosSaleFlow(page, {
      tenantBaseUrl,
      subsidiaryName: scenario.subsidiaryName,
      productName: scenario.products.estandar,
      afterProductSelect: async (page) => {
        await test.step("Add additional products to the cart", async () => {
          await searchAndSelectProduct(page, { name: scenario.products.combo });
          await searchAndSelectProduct(page, { name: scenario.products.servicio });
        });

        await assignTipToSale(page, scenario.tipToType);
      },
      beforeFinish: async (page) => {
        await assertSalePanelUI(page, precision.ui);
      },
      afterPaymentModalOpen: async (page) => {
        await assertPaymentModalUI(page, precision.ui);
      }
    });

    const request = await requestPromise;
    const body = request.postDataJSON();
    assertSummaryPrecision(body, precision.summary);
    expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
    assertPaymentPayloadPrecision(body, precision);
  });

  test("Case 2: Direct Sale with General Discount and Tip", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();
    const precision = scenario.case2;
    
    const requestPromise = captureSaleMutation(page);

    await runPosSaleFlow(page, {
      tenantBaseUrl,
      subsidiaryName: scenario.subsidiaryName,
      productName: scenario.products.combo,
      afterProductSelect: async (page) => {
        await test.step("Add another product and apply discount", async () => {
          await searchAndSelectProduct(page, { name: scenario.products.estandar });
          await applyGeneralDiscount(page, "3.3337373372323"); 
        });

        await assignTipToSale(page, scenario.tipToType);
      },
      beforeFinish: async (page) => {
        await assertSalePanelUI(page, precision.ui);
      },
      afterPaymentModalOpen: async (page) => {
        await assertPaymentModalUI(page, precision.ui);
      }
    });

    const request = await requestPromise;
    const body = request.postDataJSON();
    assertSummaryPrecision(body, precision.summary);
    expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
    assertPaymentPayloadPrecision(body, precision);
  });

  test("Case 3: Full Table Payment with Composite Inventory and Tip", async ({ page, browser }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();
    const precision = scenario.case3;

    await withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, async (page, activeTableName) => {
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
        const requestPromise = captureSaleMutation(page);
        
                const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
        await finishSaleButton.click();
        await page.waitForURL(/\/pos\/restaurant-payments/);
        
        await assertPaymentModalUI(page, precision.ui);
        
        await completePayment(page);
        
        const request = await requestPromise;
        const body = request.postDataJSON();
        assertSummaryPrecision(body, precision.summary);
        expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
        assertPaymentPayloadPrecision(body, precision);
      });
    }, { quantity: 1 });
  });

  test("Case 4: Separate Check Payment with Tip", async ({ page, browser }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();
    const precision = scenario.case4;

    await withActiveRestaurantOrderSafe(browser, page, tenantBaseUrl, async (page, activeTableName) => {
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
        const requestPromise = captureSaleMutation(page);
        
                const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
        await finishSaleButton.click();
        await page.waitForURL(/\/pos\/restaurant-payments/);
        
        await assertPaymentModalUI(page, precision.ui);
        
        await completePayment(page);
        
        const request = await requestPromise;
        const body = request.postDataJSON();
        assertSummaryPrecision(body, precision.summary);
        expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
        assertPaymentPayloadPrecision(body, precision);
      });
    }, { quantity: 2 });
  });

  test("Case 5: Direct Sale with Surcharge and Tip", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();
    const precision = scenario.case5;

    const requestPromise = captureSaleMutation(page);

    await runPosSaleFlow(page, {
      tenantBaseUrl,
      subsidiaryName: scenario.subsidiaryName,
      productName: scenario.products.combo,
      afterProductSelect: async (page) => {
        await test.step("Add another product and apply surcharge", async () => {
          await searchAndSelectProduct(page, { name: scenario.products.estandar });
          await applyManualSurcharge(page, "3.3337373372323"); 
        });

        await assignTipToSale(page, scenario.tipToType);
      },
      beforeFinish: async (page) => {
        await assertSalePanelUI(page, precision.ui);
      },
      afterPaymentModalOpen: async (page) => {
        await assertPaymentModalUI(page, precision.ui);
      }
    });

    const request = await requestPromise;
    const body = request.postDataJSON();
    assertSummaryPrecision(body, precision.summary);
    expect(String(body.additional_tip)).toBe(String(precision.root.additional_tip));
    assertPaymentPayloadPrecision(body, precision);
  });

});

}