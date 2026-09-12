import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { runAdminSaleFlow } from "./harness/admin-sale-flow.js";
import { cancelFirstSaleAndVerify } from "./harness/cancel-sale-helpers.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "admin-sale-cancellation.json"), "utf-8")
);

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Normal Sales (Admin)", () => {
  for (const scenario of scenarios) {
    if (scenario.skip) continue;

    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      test("Creates a normal sale and cancels it", async ({ page }) => {
        test.setTimeout(180_000);

        await test.step("Create Normal Sale", async () => {
          await runAdminSaleFlow(page, {
            tenantBaseUrl,
            authType: scenario.authType,
            documentType: scenario.saleParams.documentType,
            productName: scenario.saleParams.productName,
          });
        });

        await test.step("Cancel Sale and Verify Modal", async () => {
          await cancelFirstSaleAndVerify(page, {
            tenantBaseUrl,
            expectSwitch: scenario.cancellationParams.expectSwitch,
            expectMessage: scenario.cancellationParams.expectMessage,
          });
        });
      });
    });
  }
});
