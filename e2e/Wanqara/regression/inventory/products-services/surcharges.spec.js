import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";
import { SEED } from "../../../harness/seed.js";
import { ACTION_TOOLTIPS } from "../../../harness/action-tooltips.js";

test.describe("Inventory — Surcharges @regression", () => {
  requirePosCredentials(test);

  test("ensures a manual surcharge is cleanly created and verified", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const { name, percentage } = SEED.surcharge.crud;

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/surcharges/list"),
      addPath: withPath(tenantBaseUrl, "/admin/surcharges/add"),
      name: name,
      fillForm: async (page) => {
        await page.getByRole("textbox", { name: /Nombre del recargo/i }).fill(name);
        const percentageInput = page.getByPlaceholder("Porcentaje del recargo");
        await percentageInput.fill(percentage);
        await percentageInput.press("Tab");
      },
      endpointPattern: "/api/v1/general/surcharges",
      confirmButtonRegex: /^Confirmar$/i,
      deleteTooltip: ACTION_TOOLTIPS.surcharges.delete,
    });
  });
});