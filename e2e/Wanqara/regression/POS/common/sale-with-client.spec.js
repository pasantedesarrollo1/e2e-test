import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-with-client.json"), "utf-8")
);

import { selectClientFromSearchModal } from "../../../harness/helpers/client-helpers.js";

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

for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Sales with Customer Assignment @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    const runTest = (title, bodyFn) => {
      if (scenario.fixture === 'posPage') {
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

        await selectClientFromSearchModal(page, scenario.clientParams.testCedula, {
          triggerLocator: personasButton,
          modalLocator: personModal,
          expectModalClosed: true,
        });

        await expect(page.getByText(scenario.clientParams.testName)).toBeVisible();
      });

      await test.step("Reassign customer by typing cedula directly", async () => {
        const cedulaInput = page.getByRole("textbox", { name: /Ingresa Cédula o RUC/i });
        await cedulaInput.fill(scenario.clientParams.consumidorFinalCedula);
        await cedulaInput.press("Enter");

        await confirmClientModal(page);

        await expect(
          page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i })
        ).not.toBeVisible({ timeout: 10000 });

        await expect(
          page.getByText(scenario.clientParams.consumidorFinalCedula)
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
        await identityInput.fill(scenario.clientParams.consumidorFinalCedula);

        const magnifyButton = clientModal
          .locator("button")
          .filter({ has: page.locator(".mdi-magnify") })
          .first();
        await expect(magnifyButton).toBeEnabled();
        await magnifyButton.click();

        await confirmClientModal(page);

        await expect(
          page.getByText(scenario.clientParams.consumidorFinalCedula)
        ).toBeVisible();
      });

      await test.step("Complete the sale with the assigned customer and print ticket", async () => {
        await runPosSaleFlow(page, {
          tenantBaseUrl: getTenantBaseUrl(),
          productName: scenario.clientParams.productName,
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
