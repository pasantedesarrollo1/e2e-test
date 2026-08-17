import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED, getElectronicInvoicingAuthType } from "../../../harness/seed.js";
import { runAdminSaleFlow } from "./harness/admin-sale-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("Admin Sales — Electronic Invoice @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath(getElectronicInvoicingAuthType()) });

  test("successfully completes a sale using an Electronic Invoice", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: getElectronicInvoicingAuthType(),
      documentType: SEED.documentTypes.facturaElectronica,
      productName: SEED.products.estandar.name,
    });
  });
});

test.describe("Admin Sales — Receipts (without dispatch) @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("successfully completes a sale using Receipts", async ({ page }) => {
    test.setTimeout(120_000);

    await runAdminSaleFlow(page, {
      tenantBaseUrl,
      authType: "retail",
      documentType: SEED.documentTypes.recibos,
      productName: SEED.products.estandar.name,
    });
  });
});