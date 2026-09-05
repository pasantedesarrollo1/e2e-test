import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  requireChefCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import {
  finalizeSaleWithPayment,
  withActiveRestaurantOrder,
} from "./harness/pos-orders-common.js";

test.describe("POS Restaurant — Collect Orders @regression", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test("collects an existing order, assigns a client and completes the sale", async ({ page }) => {
    test.setTimeout(180_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await withActiveRestaurantOrder(page, tenantBaseUrl, async (page, activeTableName) => {
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
});