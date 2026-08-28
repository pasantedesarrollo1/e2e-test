import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { ensureCleanRecord } from "../../../harness/crud-helpers.js";
import { withPath } from "../../../harness/urls.js";
import { SEED } from "../../../harness/seed.js";

test.describe("Inventory — Sizes @regression", () => {
  requirePosCredentials(test);

  test("ensures a size is cleanly created and verified in the list", async ({ page }) => {
    const tenantBaseUrl = getTenantBaseUrl();
    const { name, observation } = SEED.attributes.size;

    test.info().annotations.push({
      type: "issue",
      description: "https://wanqara-team.atlassian.net/browse/WS-941",
    });

    test.fixme(
      true,
      "Bypass temporal (WS-941): Bug en validación, ahora cualquier nombre indica que ya está en uso y bloquea la creación."
    );

    await ensureCleanRecord(page, {
      listPath: withPath(tenantBaseUrl, "/admin/sizes/list"),
      addPath: withPath(tenantBaseUrl, "/admin/sizes/add"),
      name: name,
      fillForm: async (page) => {
        await page.getByRole("textbox", { name: /Nombre de la Talla/i }).fill(name);
        await page.getByRole("textbox", { name: /Observación de la talla/i }).fill(observation);
      },
      endpointPattern: "/api/v1/general/sizes",
      successMessage: "Talla Creada",
      deleteSuccessMessage: "Talla Eliminada",
      confirmButtonRegex: /^Aceptar$/i,
    });
  });
});