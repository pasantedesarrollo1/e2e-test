import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { SEED } from "../../../harness/seed.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { getSessionPath } from "../../../harness/auth.js";
import { selectClientFromSearchModal } from "../../../harness/client-helpers.js";

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

const environments = [
  { name: 'Retail',     authType: 'retail',     fixture: 'posPage' },
  { name: 'Restaurant', authType: 'restaurant', fixture: 'posRestaurantPage' }
];

for (const env of environments) {
  test.describe(`POS ${env.name} — Sales with Customer Assignment @regression`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(env.authType) });

    const runTest = (title, bodyFn) => {
      if (env.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    runTest("validates all customer assignment methods and completes the sale", async (page) => {
      test.setTimeout(180_000);

      await test.step("Assign customer via Personas search modal", async () => {
        const personasButton = page
          .locator(".v-btn--icon.bg-primary.v-btn--density-default")
          .first();

        const personModal = page
          .locator(".v-overlay__content")
          .filter({ hasText: /Personas/i })
          .first();

        await selectClientFromSearchModal(page, SEED.clients.test.cedula, {
          triggerLocator: personasButton,
          modalLocator: personModal,
          expectModalClosed: true,
        });

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

      await test.step("Complete the sale with the assigned customer and print ticket", async () => {
        await runPosSaleFlow(page, {
          tenantBaseUrl: getTenantBaseUrl(),
          productName: SEED.products.estandar.name,
          skipNavigation: true,
          printTicket: true,
        });
      });

      await test.step("Verify 'Comprobante Impreso' notification", async () => {
        await expect(
          page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
        ).toBeVisible({ timeout: 15000 });
      });
    });
  });
}