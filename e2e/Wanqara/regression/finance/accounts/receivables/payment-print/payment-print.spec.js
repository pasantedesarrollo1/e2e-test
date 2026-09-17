import { test } from "../../../../../harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "../../../../../harness/config/settings.js";
import { processPaymentAndVerifyPrinter } from "./harness/payment-print-helpers.js";
import { generateDataDrivenTests } from "../../../../../harness/helpers/test-generator.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "payment-print.json"), "utf-8")
);

test.describe("Finance - Receivables (Payment Print)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {

    test.use({ 
      targetPath: "/admin/receivables/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode
    });

    test(`ensures payment is sent to printer with correct amount`, async ({ adminApp }) => {
      const { page } = adminApp;
      test.setTimeout(60_000); 

      await test.step("Process payment and intercept printer request", async () => {
        await processPaymentAndVerifyPrinter(page, scenario.paymentData);
      });
    });

  });
  
});
