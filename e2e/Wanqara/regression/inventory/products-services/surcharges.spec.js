import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";

test.describe("Inventory — Surcharges @regression", () => {
  requirePosCredentials(test);

  test("ensures a 10% surcharge is cleanly created and verified", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const SURCHARGE_NAME = "Recargo Test Automatizado";

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/surcharges/list"),
      addPath: withPath(tenantBaseUrl, "/admin/surcharges/add"),
      name: SURCHARGE_NAME,
      fillForm: async (page) => {
        await page.getByRole("textbox", { name: /Nombre del recargo/i }).fill(SURCHARGE_NAME);
        const percentageInput = page.getByPlaceholder("Porcentaje del recargo");
        await percentageInput.fill("10");
        await percentageInput.press("Tab");
      },
      endpointPattern: "/api/v1/general/surcharges",
      confirmButtonRegex: /^Confirmar$/i,
    });
  });
});