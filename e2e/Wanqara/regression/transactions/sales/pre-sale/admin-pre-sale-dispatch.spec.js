import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath } from "../../../../harness/auth.js";
import { SEED, getDynamicDocumentType } from "../../../../harness/seed.js";
import { runAdminPreSaleFlow, searchAndSelectProduct } from "../harness/admin-pre-sale-flow.js";
import { selectFirstVariant } from "../../../POS/harness/pos-products.js";

const tenantBaseUrl = getTenantBaseUrl();

async function buildMixedCart(page, dispatchEnabled = false) {
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
  await expect(page.locator("main").getByText(SEED.products.estandar.name, { exact: false }).first()).toBeVisible();

  await searchAndSelectProduct(page, { name: SEED.products.serie.name });
  await expect(page.locator("main").getByText(SEED.products.serie.name, { exact: false }).first()).toBeVisible();

  await searchAndSelectProduct(page, { name: SEED.products.tallaColor.name });
  await selectFirstVariant(page);
}

test.describe("Admin Pre-Sales — Mixed Cart WITH Subsequent Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("dispatch") });

  test("completes a pre-sale with a mixed cart with subsequent dispatch enabled", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminPreSaleFlow(page, {
      tenantBaseUrl,
      authType: "dispatch",
      documentType: getDynamicDocumentType("dispatch"),
      productName: null,
      beforeFinish: async (p) => await buildMixedCart(p, true),
    });
  });
});

test.describe("Admin Pre-Sales — Mixed Cart WITHOUT Subsequent Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("completes a pre-sale with a mixed cart without subsequent dispatch enabled", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminPreSaleFlow(page, {
      tenantBaseUrl,
      authType: "retail",
      documentType: getDynamicDocumentType("retail"),
      productName: null,
      beforeFinish: async (p) => await buildMixedCart(p, false),
    });
  });
});