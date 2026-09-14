import { test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth/auth.js";
import { runAdminPreSaleFlow } from "../harness/admin-pre-sale-flow.js";
import { cancelFirstSaleAndVerify } from "../harness/cancel-sale-helpers.js";

import scenarios from "./0-json-data/admin-pre-sale-cancellation.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe.serial("Cancel Pre-Sales (Admin)", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Creates a pre-sale and cancels it (focus)" : "Creates a pre-sale and cancels it",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ browser }) => {
        test.setTimeout(180_000);
        
        // Using fresh contexts across serial runs to guarantee state isolation
        const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
        const page = await context.newPage();

        await test.step("Create Pre-Sale", async () => {
          await runAdminPreSaleFlow(page, {
            authType: scenario.authType,
            documentType: scenario.saleParams.documentType,
              clientCedula: scenario.saleParams.clientCedula,
              paymentMethod: scenario.saleParams.paymentMethod,
            productName: scenario.saleParams.productName});
        });

        await test.step("Cancel Pre-Sale and Verify Modal", async () => {
          await cancelFirstSaleAndVerify(page, {
            expectSwitch: scenario.cancelParams.expectSwitch,
            expectMessage: scenario.cancelParams.expectMessage});
        });

        await page.close();
        await context.close();
      }
    );
  });
});
