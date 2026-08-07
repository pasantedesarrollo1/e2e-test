import { test } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";

test.describe("Inventory — Brands @regression", () => {
  requirePosCredentials(test);

  test("ensures a brand is cleanly created and verified in the list", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const BRAND_NAME = "Marca Test Automatizado";

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/brands/list"),
      addPath: withPath(tenantBaseUrl, "/admin/brands/add"),
      name: BRAND_NAME,
      fillForm: async (page) => {
        await page.getByPlaceholder("Nombre de la Marca").fill(BRAND_NAME);
        await page.getByPlaceholder("Orden de la Marca").fill("1");
        await page.getByPlaceholder("Observaciones").fill("test");
      },
      endpointPattern: "/api/v1/inventory/brands",
      confirmButtonRegex: /^Aceptar$/i,
    });
  });
});