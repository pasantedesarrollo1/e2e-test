import os
import re

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'POS-R', 'change-order-status-flow.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "change-order-status-flow.json"), "utf-8")
);
"""

content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

new_block = """for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Change Order Status Flow @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    requireChefCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
      const cleanupPage = await context.newPage();
      
      await closeAllActiveOrders(cleanupPage, getTenantBaseUrl());
      
      await context.close();
    });

    test("creates an order in Chef, prints preticket, and changes status back to pending in POS", async ({ page }) => {
      test.setTimeout(180_000);

      const tenantBaseUrl = getTenantBaseUrl();

      await test.step("Create order and print preticket from Chef", async () => {
        await createChefOrder(page);
        await printPreticket(page);
      });

      await test.step("Navigate to restaurant POS", async () => {
        await navigateToRestaurantPOS(page, tenantBaseUrl);
      });

      await test.step("Open More Options menu and navigate to Change Order Status", async () => {
        await navigateToChangeOrderStatusFromOptions(page);
      });

      await test.step("Select the order", async () => {
        await selectOrderToChangeStatus(page);
      });

      await test.step("Process order status change to pending", async () => {
        await processOrderStatusChange(page);
      });
    });
  });
}"""

content = re.sub(r'test\.describe\("POS Restaurant - Change Order Status Flow @regression", \(\) => \{.*', new_block, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
