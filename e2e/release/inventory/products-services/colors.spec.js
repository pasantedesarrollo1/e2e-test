import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";

test.describe("Inventory — Colors @release", () => {
  requirePosCredentials(test);

  test("ensures a color is cleanly created and verified in the list", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const COLOR_NAME = "Color Test Automatizado";

    test.info().annotations.push({
      type: "issue",
      description: "https://wanqara-team.atlassian.net/browse/WS-870",
    });

    test.fixme(
      true,
      "Bypass temporal (WS-870): Un color borrado sigue constando en uso en el sistema, lo que bloquea la creación del nuevo color al lanzar un error de duplicidad."
    );

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/colors/list"),
      addPath: withPath(tenantBaseUrl, "/admin/colors/add"),
      name: COLOR_NAME,
      fillForm: async (page) => {
        await page.getByRole("textbox", { name: /Nombre del color/i }).fill(COLOR_NAME);
        await page.getByRole("textbox", { name: /Observación del color/i }).fill("Observación de prueba automatizada");
        const colorSwatch = page.locator(".v-color-picker-swatches__color > div").first();
        await expect(colorSwatch).toBeVisible();
        await colorSwatch.click();
      },
      endpointPattern: "/api/v1/general/colors",
      successMessage: "Color Creado",
      deleteSuccessMessage: "Color Eliminado",
      confirmButtonRegex: /^Aceptar$/i,
    });
  });
});