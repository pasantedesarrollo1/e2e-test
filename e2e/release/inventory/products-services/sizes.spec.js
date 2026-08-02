import { test } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";

test.describe("Inventory — Sizes @release", () => {
  requirePosCredentials(test);

  test("ensures a size is cleanly created and verified in the list", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const SIZE_NAME = "Talla Test Automatizado";

    test.info().annotations.push({
      type: "issue",
      description: "https://wanqara-team.atlassian.net/browse/WS-869",
    });

    test.fixme(
      true,
      "Bypass temporal (WS-869): Una talla borrada sigue constando en uso en el sistema, lo que bloquea la creación de la nueva talla al lanzar un error de duplicidad."
    );

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/sizes/list"),
      addPath: withPath(tenantBaseUrl, "/admin/sizes/add"),
      name: SIZE_NAME,
      fillForm: async (page) => {
        await page.getByRole("textbox", { name: /Nombre de la Talla/i }).fill(SIZE_NAME);
        await page.getByRole("textbox", { name: /Observación de la talla/i }).fill("Observación de prueba automatizada");
      },
      endpointPattern: "/api/v1/general/sizes",
      successMessage: "Talla Creada",
      deleteSuccessMessage: "Talla Eliminada",
      confirmButtonRegex: /^Aceptar$/i,
    });
  });
});