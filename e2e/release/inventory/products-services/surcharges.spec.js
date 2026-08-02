import { test } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";

test.describe("Inventory — Surcharges @release", () => {
  requirePosCredentials(test);

  test("ensures a 10% surcharge is cleanly created and verified", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const SURCHARGE_NAME = "Recargo Test Automatizado";

    test.info().annotations.push({
      type: "issue",
      description: "https://wanqara-team.atlassian.net/browse/WS-868",
    });

    test.fixme(
      true,
      "Bypass temporal (WS-868): Bug bloqueante en la búsqueda. Impide validar si el recargo existe para borrarlo o confirmar su creación."
    );

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