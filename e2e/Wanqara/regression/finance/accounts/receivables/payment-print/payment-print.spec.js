import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../../harness/config/settings.js";
import { ensureAuthenticated } from "../../../../../harness/helpers/auth/auth.js";
import { processPaymentAndVerifyPrinter } from "./harness/payment-print-helpers.js";

import scenarios from "./0-json-data/payment-print.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../../harness/helpers/test-generator.js";

test.describe("Finance - Receivables (Payment Print)", () => {
  requirePosCredentials(test);

    generateDataDrivenTests(test, scenarios, (scenario) => {
      // Dinámicamente añadir el ticket si es un test de release o tiene metadata válida

      // Resolvemos el authType dinámicamente


      test(`ensures payment is sent to printer with correct amount`, async ({ page }) => {
        test.setTimeout(60_000); 

        await test.step("Navigate to receivables list route", async () => {
          await ensureAuthenticated(page, { 
            targetPath: "/admin/receivables/list", 
            authType: scenario.authType 
          });
        });

        await test.step("Process payment and intercept printer request", async () => {
          await processPaymentAndVerifyPrinter(page, scenario.paymentData);
        });
      });
    });
  
});
