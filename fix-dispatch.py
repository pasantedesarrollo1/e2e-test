import os
import re

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'POS-C', 'sale-inventory-dispatch.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-inventory-dispatch.json"), "utf-8")
);

const CALLBACK_MAP = {
  selectFirstVariant,
  selectFirstSerie
};
"""

content = content.replace('import { SEED } from "../../../harness/config/seed.js";\n', '')
content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

new_execute_sales = """async function executeSales(page, { tenantBaseUrl, dispatchEnabled, products }) {
  for (const product of products) {
    const afterProductSelect = product.afterSelectCallback ? CALLBACK_MAP[product.afterSelectCallback] : null;
    await test.step(`Sale [${product.type}] - ${product.name}`, async () => {
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: product.name,
        searchTerm: null,
        afterProductSelect,
      });
    });
  }
}

for (const scenario of scenarios) {
  test.describe(`POS Retail - ${scenario.description} @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test(`completes multiple sales seamlessly with dispatch ${scenario.dispatchEnabled ? 'enabled' : 'disabled'}`, async ({ posPage: page }) => {
      test.setTimeout(180_000);
      await executeSales(page, {
        tenantBaseUrl: getTenantBaseUrl(),
        dispatchEnabled: scenario.dispatchEnabled,
        products: scenario.products,
      });
    });
  });
}
"""

content = re.sub(r'function buildProbeProducts.*?dispatchEnabled \}\) \{.*', new_execute_sales, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
