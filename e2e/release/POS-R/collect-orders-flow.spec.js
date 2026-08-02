import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../harness/settings.js";
import {
  createChefOrder,
  navigateToRestaurantPOS,
  openAndSelectOrder,
  finalizeSaleWithPayment,
} from "../harness/pos-orders-common.js";

test.describe.configure({ mode: "serial" });

test.describe("POS Restaurant — Collect Orders @release", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test("creates a new order from Chef", async ({ page }) => {
    test.setTimeout(120_000);
    await createChefOrder(page);
  });

  test("collects an existing order, assigns a client and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to restaurant POS", async () => {
      await navigateToRestaurantPOS(page, tenantBaseUrl);
    });

    await test.step("Open orders modal and select order", async () => {
      await openAndSelectOrder(page);
    });

    await test.step("Load order into POS via Procesar pago", async () => {
      const cobrarBtn = page
        .getByRole("button", { name: /Cobrar/i })
        .filter({ hasText: /Procesar pago/i })
        .first();
      await expect(cobrarBtn).toBeVisible();
      await cobrarBtn.click();
      await expect(page.getByText(/Cliente:/i)).toBeVisible();
    });

    await test.step("Assign customer, finish sale and complete payment", async () => {
      await finalizeSaleWithPayment(page);
    });
  });
});