import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTenantBaseUrl, requirePosCredentials } from "../../../harness/config/settings.js";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { test } from "../harness/pos-fixtures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-inventory-dispatch.json"), "utf-8")
);

import { selectFirstSerie, selectFirstVariant } from "../harness/pos-products.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";

const CALLBACK_MAP = {
  selectFirstVariant,
  selectFirstSerie
};


async function executeSales(page, { tenantBaseUrl, dispatchEnabled, products }) {
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
