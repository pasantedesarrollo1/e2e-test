import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth/auth.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { searchAndSelectProduct, selectCheckout, selectPaymentMethod, submitAdminSale } from "./harness/admin-checkout-helpers.js";
import { selectDocumentType } from "./harness/admin-document-helpers.js";
import { applyGeneralDiscount, applyManualSurcharge } from "../harness/admin-modifier-helpers.js";

import scenarios from "./0-json-data/admin-sale-modifiers.json" with { type: "json" };

import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";

const MODIFIERS_MAP = {
  "discount": applyGeneralDiscount,
  "surcharge": applyManualSurcharge
};

test.describe("Admin Sales - Sale Modifiers", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Completes a sale applying a modifier (focus)" : "Completes a sale applying a modifier",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(120_000);
        
        const modifierFn = MODIFIERS_MAP[scenario.saleParams.modifierType];
        if (!modifierFn) {
          throw new Error(`Invalid modifierType: ${scenario.saleParams.modifierType}`);
        }

        await test.step(`Create Admin Sale with modifier: ${scenario.saleParams.modifierType}`, async () => {
          await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await selectCheckout(page, { warehouseName: scenario.saleParams.warehouseName });
            await selectDocumentType(page, scenario.saleParams.documentType);
            await selectClientByCedula(page, scenario.saleParams.clientCedula);
            await searchAndSelectProduct(page, { name: scenario.saleParams.productName });
            await modifierFn(page, scenario.saleParams.modifierRate);
            await selectPaymentMethod(page, scenario.saleParams.paymentMethod);
            await submitAdminSale(page);
        });
      }
    );
  });
});