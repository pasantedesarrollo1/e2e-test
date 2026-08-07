import { test } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { SEED } from "../../../harness/seed.js";
import { getSessionPath } from "../../../harness/auth.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { selectFirstVariant, selectFirstSerie } from "../harness/pos-products.js";

function buildProbeProducts({ dispatchEnabled }) {
  return [
    {
      ...SEED.products.estandar,
      searchTerm: null,
      afterProductSelect: null,
    },
    {
      ...SEED.products.serie,
      searchTerm: null,
      type: "Serie-por-nombre",
      afterProductSelect: dispatchEnabled ? null : selectFirstSerie,
    },
    {
      ...SEED.products.tallaColor,
      searchTerm: null,
      type: "TallaColor-por-nombre",
      afterProductSelect: selectFirstVariant,
    },
  ];
}

async function executeSales(page, { tenantBaseUrl, dispatchEnabled }) {
  const products = buildProbeProducts({ dispatchEnabled });

  for (const { name, type, searchTerm, afterProductSelect } of products) {
    await test.step(`Sale [${type}] — ${name}`, async () => {
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: name,
        searchTerm,
        afterProductSelect,
      });
    });
  }
}

test.describe("POS Retail — Sales WITH Post-Sale Inventory Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("dispatch") });

  test("completes multiple sales seamlessly with dispatch enabled", async ({ posPage: page }) => {
    test.setTimeout(180_000);
    await executeSales(page, {
      tenantBaseUrl: getTenantBaseUrl(),
      dispatchEnabled: true,
    });
  });
});

test.describe("POS Retail — Sales WITHOUT Post-Sale Inventory Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("completes multiple sales seamlessly with dispatch disabled", async ({ posPage: page }) => {
    test.setTimeout(180_000);
    await executeSales(page, {
      tenantBaseUrl: getTenantBaseUrl(),
      dispatchEnabled: false,
    });
  });
});