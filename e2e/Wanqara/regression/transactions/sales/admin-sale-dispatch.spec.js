import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED, getDynamicDocumentType } from "../../../harness/seed.js";
import { runAdminSaleFlow, searchAndSelectProduct } from "./harness/admin-sale-flow.js";
import { selectFirstVariant, selectFirstSerie } from "../../POS/harness/pos-products.js";

const tenantBaseUrl = getTenantBaseUrl();

async function buildMixedCart(page, dispatchEnabled = false) {
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });

  await searchAndSelectProduct(page, { name: SEED.products.serie.name });
  if (!dispatchEnabled) {
    await selectFirstSerie(page);
  }

  await searchAndSelectProduct(page, { name: SEED.products.tallaColor.name });
  await selectFirstVariant(page);
}

test.describe("Admin Sales — Mixed Cart WITH Subsequent Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("dispatch") });

  test("completes a sale with a mixed cart with subsequent dispatch enabled", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "dispatch",
      documentType: getDynamicDocumentType("dispatch"),
      productName: null,
      beforeFinish: async (p) => await buildMixedCart(p, true),
    });
  });
});

test.describe("Admin Sales — Mixed Cart WITHOUT Subsequent Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("completes a sale with a mixed cart without subsequent dispatch enabled", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "retail",
      documentType: getDynamicDocumentType("retail"),
      productName: null,
      beforeFinish: async (p) => await buildMixedCart(p, false),
    });
  });
});