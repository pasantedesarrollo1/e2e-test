import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";
import { SEED } from "../../../harness/seed.js";
import { ACTION_TOOLTIPS } from "../../../harness/action-tooltips.js";

test.describe("Inventory — Brands @regression", () => {
  requirePosCredentials(test);

  test("ensures a brand is cleanly created and verified in the list", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const { name, order, observation } = SEED.attributes.brand;

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/brands/list"),
      addPath: withPath(tenantBaseUrl, "/admin/brands/add"),
      name: name,
      fillForm: async (page) => {
        await page.getByPlaceholder("Nombre de la Marca").fill(name);
        await page.getByPlaceholder("Orden de la Marca").fill(order);
        await page.getByPlaceholder("Observaciones").fill(observation);
      },
      endpointPattern: "/api/v1/inventory/brands",
      confirmButtonRegex: /^Aceptar$/i,
      deleteTooltip: ACTION_TOOLTIPS.brands.delete,
    });
  });
});