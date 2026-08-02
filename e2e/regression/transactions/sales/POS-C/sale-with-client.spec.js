import { test, expect } from "../../../harness/pos-fixtures.js";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../../harness/settings.js";
import { SEED } from "../../../../harness/seed.js";
import { runPosSaleFlow } from "../../../harness/pos-sale-flow.js";

async function confirmClientModal(page) {
  const clientModal = page
    .locator(".v-overlay__content")
    .filter({ has: page.getByRole("button", { name: /Guardar Cliente/i }) })
    .first();
  await expect(clientModal).toBeVisible();

  const guardarButton = clientModal.getByRole("button", { name: /Guardar Cliente/i });
  await expect(guardarButton).toBeEnabled();
  await guardarButton.click();

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i })
  ).toBeVisible({ timeout: 20000 });
}

test.describe("POS Retail — Sales with Customer Assignment @regression", () => {
  requirePosCredentials(test);

  test("validates all customer assignment methods and completes the sale", async ({ posPage: page }) => {
    test.setTimeout(180_000);

    await test.step("Assign customer via Personas search modal", async () => {
      const personasButton = page
        .locator(".v-btn--icon.bg-primary.v-btn--density-default")
        .first();
      await expect(personasButton).toBeEnabled();
      await personasButton.click();

      const personModal = page
        .locator(".v-overlay__content")
        .filter({ hasText: /Personas/i })
        .first();
      await expect(personModal).toBeVisible();

      const searchField = personModal.getByRole("textbox", {
        name: /Busca lo que necesites/i,
      });
      await searchField.fill(SEED.clients.test.cedula);

      const targetRow = personModal
        .getByRole("table")
        .getByText(SEED.clients.test.cedula);
      await expect(targetRow).toBeVisible();
      await targetRow.click();

      await expect(personModal).not.toBeVisible();
      await expect(page.getByText(SEED.clients.test.name)).toBeVisible();
    });

    await test.step("Reassign customer by typing cedula directly", async () => {
      const cedulaInput = page.getByRole("textbox", { name: /Ingresa Cédula o RUC/i });
      await cedulaInput.fill(SEED.clients.consumidorFinal.cedula);
      await cedulaInput.press("Enter");

      await confirmClientModal(page);

      await expect(
        page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i })
      ).not.toBeVisible({ timeout: 10000 });

      await expect(
        page.getByText(SEED.clients.consumidorFinal.cedula)
      ).toBeVisible();
    });

    await test.step("Reassign customer via lookup dialog with identity type selection", async () => {
      const cedulaInput = page.getByRole("textbox", { name: /Ingresa Cédula o RUC/i });
      await cedulaInput.clear();

      const cedulaField = page.locator(".v-text-field").filter({
        has: page.getByRole("textbox", { name: /Ingresa Cédula o RUC/i }),
      });
      const searchIconButton = cedulaField.getByRole("button").first();
      await expect(searchIconButton).toBeVisible();
      await searchIconButton.click();

      const clientModal = page
        .locator(".v-overlay__content")
        .filter({ has: page.locator("#identity-input") })
        .first();
      await expect(clientModal).toBeVisible();

      const tipoIdentidadInput = clientModal
        .locator(".v-select")
        .filter({
          has: page.locator("input[placeholder='Seleccione un tipo de identificación']"),
        })
        .locator(".v-field__input");
      await tipoIdentidadInput.click();

      const cedulaOption = page.getByRole("option", { name: /^CEDULA$/i });
      await expect(cedulaOption).toBeVisible();
      await cedulaOption.click();
      await expect(cedulaOption).not.toBeVisible();

      const identityInput = clientModal.locator("#identity-input");
      await expect(identityInput).toBeVisible();
      await expect(identityInput).not.toHaveAttribute("readonly");
      await identityInput.fill(SEED.clients.consumidorFinal.cedula);

      const magnifyButton = clientModal
        .locator("button")
        .filter({ has: page.locator(".mdi-magnify") })
        .first();
      await expect(magnifyButton).toBeEnabled();
      await magnifyButton.click();

      await confirmClientModal(page);

      await expect(
        page.getByText(SEED.clients.consumidorFinal.cedula)
      ).toBeVisible();
    });

    await test.step("Complete the sale with the assigned customer", async () => {
      await runPosSaleFlow(page, {
        tenantBaseUrl: getTenantBaseUrl(),
        productName: SEED.products.estandar.name,
        skipNavigation: true,
      });
    });
  });
});