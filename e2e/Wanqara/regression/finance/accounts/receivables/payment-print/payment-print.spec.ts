/* eslint-disable */
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { processPaymentAndVerifyPrinter } from "./harness/payment-print-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

import type { PaymentPrintOptions } from '@/e2e/Wanqara/regression/finance/accounts/receivables/payment-print/harness/payment-print-helpers.js';
interface ScenarioData extends FlatScenario {
  subsidiaryName: string;
  subsidiaryCode: string;
  authType: string;
  loginMode: "fresh" | "cached" | "";
  paymentData: PaymentPrintOptions;
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "payment-print.json"), "utf-8"))
);

test.describe("Finance - Receivables (Payment Print)", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {

    test.use({ 
      targetPath: "/admin/receivables/list",
      subsidiaryName: scenario.subsidiaryName, 
      subsidiaryCode: scenario.subsidiaryCode,
      authType: scenario.authType, 
      loginMode: scenario.loginMode as any
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
