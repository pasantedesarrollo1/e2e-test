import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED, getDynamicDocumentType } from "../../../harness/seed.js";
import { runAdminSaleFlow, applyGeneralDiscount, applyManualSurcharge } from "./harness/admin-sale-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("Admin Sales — Sale Modifiers (without dispatch) @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("completes a sale applying a general discount", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "retail",
      documentType: getDynamicDocumentType("retail"),
      productName: SEED.products.estandar.name,
      beforeFinish: async (p) => await applyGeneralDiscount(p),
    });
  });

  test("completes a sale applying a manual surcharge", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "retail",
      documentType: getDynamicDocumentType("retail"),
      productName: SEED.products.estandar.name,
      beforeFinish: async (p) => await applyManualSurcharge(p),
    });
  });
});

test.describe("Admin Sales — Sale Modifiers (with dispatch) @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("dispatch") });

  test("completes a sale applying a general discount", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "dispatch",
      documentType: getDynamicDocumentType("dispatch"),
      productName: SEED.products.estandar.name,
      beforeFinish: async (p) => await applyGeneralDiscount(p),
    });
  });

  test("completes a sale applying a manual surcharge", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "dispatch",
      documentType: getDynamicDocumentType("dispatch"),
      productName: SEED.products.estandar.name,
      beforeFinish: async (p) => await applyManualSurcharge(p),
    });
  });
});