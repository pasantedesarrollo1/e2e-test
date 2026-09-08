import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { applyGeneralDiscount } from "../harness/pos-financial-assertions.js";
import { assignTipToSale } from "./harness/pos-tip-helpers.js";
import {
  withActiveRestaurantOrder,
  finalizeSaleWithPayment,
  addProductToExistingOrder,
  collectOrder
} from "./harness/pos-orders-common.js";
import {
  navigateToSeparateOrder,
  selectProductToSeparate,
  confirmOrderSeparation,
} from "./harness/pos-separate-order.js";

test.describe("POS Restaurant — Sale with Tips Combinations @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("Case 1: Direct Sale with Mix (Standard + Combo + Service) and Tip", async ({ page }) => {
    test.setTimeout(150_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await runPosSaleFlow(page, {
      tenantBaseUrl,
      subsidiaryName: SEED.subsidiaries.restaurant.name,
      productName: SEED.products.estandar.name,
      afterProductSelect: async (page) => {
        await test.step("Add additional products to the cart", async () => {
          await searchAndSelectProduct(page, { name: SEED.products.combo.name });
          await searchAndSelectProduct(page, { name: SEED.products.servicio.name });
        });

        await assignTipToSale(page, "5.00");
      },
    });
  });

  test("Case 2: Direct Sale with General Discount and Tip", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await runPosSaleFlow(page, {
      tenantBaseUrl,
      subsidiaryName: SEED.subsidiaries.restaurant.name,
      productName: SEED.products.combo.name,
      afterProductSelect: async (page) => {
        await test.step("Add another product and apply discount", async () => {
          await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
          await applyGeneralDiscount(page, 10);
        });

        await assignTipToSale(page, "3.50");
      },
    });
  });

  test("Case 3: Full Table Payment with Composite Inventory and Tip", async ({ page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await withActiveRestaurantOrder(page, tenantBaseUrl, async (page, activeTableName) => {
      await test.step("Add recipe products (Elaborated and PreElaborated)", async () => {
        await addProductToExistingOrder(page, SEED.products.elaborado.name);
      });

      await test.step("Simulate returning to POS cart to assign tip", async () => {
        await collectOrder(page);
        await page.waitForURL(/\/pos\/restaurant-payments/);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();

        const backBtn = page.locator('.payment-topbar-left button').first();
        await backBtn.click();

        await page.waitForURL(/\/pos\/restaurant-home/);
        await expect(page.getByText(SEED.products.elaborado.name).first()).toBeVisible();
      });

      await assignTipToSale(page, "4.00");

      await test.step("Finalize sale with payment definitively", async () => {
        await finalizeSaleWithPayment(page);
      });
    }, { quantity: 1 });
  });

  test("Case 4: Separate Check Payment with Tip", async ({ page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await withActiveRestaurantOrder(page, tenantBaseUrl, async (page, activeTableName) => {
      await test.step("Navigate to separate order screen", async () => {
        await navigateToSeparateOrder(page);
      });

      await test.step("Select a product from the original table to separate it", async () => {
        await selectProductToSeparate(page, SEED.products.estandar.name);
      });

      await test.step("Confirm separation and return to main POS screen", async () => {
        await confirmOrderSeparation(page);
        await expect(page.getByText(/Cliente:/i)).toBeVisible();
      });

      await assignTipToSale(page, "2.00");

      await test.step("Assign customer, finish sale and complete payment of separate ticket", async () => {
        await finalizeSaleWithPayment(page);
      });
    }, { quantity: 2 });
  });

});
