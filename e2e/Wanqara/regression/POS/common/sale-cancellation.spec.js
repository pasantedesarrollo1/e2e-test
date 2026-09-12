import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/helpers/auth.js";
import { runPosSaleFlow, selectClientByCedula } from "../harness/pos-sale-flow.js";
import { cancelFirstSaleAndVerify } from "../../transactions/sales/harness/cancel-sale-flow.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cancellation.json"), "utf-8")
);

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Sales (POS)", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      test(scenario.description, async ({ page }) => {
        test.setTimeout(180_000);

        await test.step("Create POS Sale", async () => {
          await ensureAuthenticated(page, { 
            tenantBaseUrl, 
            targetPath: scenario.targetPath, 
            authType: scenario.authType 
          });
          
          await runPosSaleFlow(page, {
            tenantBaseUrl,
            productName: scenario.saleParams.productName,
            skipNavigation: true,
            beforeFinish: async (p) => await selectClientByCedula(p, scenario.saleParams.clientCedula),
          });
        });

        await test.step("Cancel POS Sale and Verify Modal", async () => {
          await cancelFirstSaleAndVerify(page, {
            tenantBaseUrl,
            expectSwitch: scenario.expectSwitch,
            expectMessage: scenario.expectMessage,
          });
        });
      });
    });
  }
});
