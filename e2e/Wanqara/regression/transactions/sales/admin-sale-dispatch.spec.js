import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { buildMixedCart } from "./harness/admin-cart-helpers.js";
import { selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";

import scenarios from "./0-json-data/admin-sale-dispatch.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";

test.describe("Admin Sales - Mixed Cart / Dispatch Logic", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes an admin sale with mixed cart (focus)" : "Completes an admin sale with mixed cart",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);

        await test.step("Create Admin Sale with Mixed Cart", async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
            await selectDocumentType(page, scenario.saleParams.documentType);
            await selectClientByCedula(page, scenario.saleParams.clientCedula);
            await buildMixedCart(page, scenario.saleParams.mixedCart, scenario.saleParams.dispatchEnabled);
            await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
            await submitAdminSale(page);
        });
      }
    );
  });
});