import { requirePosCredentials } from "../../harness/config/settings.js";
import { selectClientByCedula } from "../../harness/helpers/people/client-helpers.js";
import {
  openProductOptions,
  saveProductOptions,
  setDiscountInOptions,
  setQuantityInOptions,
  setUnitPriceInOptions
} from "../../regression/POS/harness/products/pos-product-options.js";
import { searchAndSelectProduct } from "../../regression/POS/harness/products/pos-search.js";

import { generateDataDrivenTests } from "../../harness/helpers/test-generator.js";
import { expect, test } from "../../harness/builders/pos.builder.js";

import scenarios from "./0-json-data/rounding-error.json" with { type: "json" };

test.describe.serial("POS Specific Cases - Rounding Errors", () => {
  requirePosCredentials(test);

  generateDataDrivenTests(test, scenarios, (scenario) => {
    const runTest = (title, bodyFn) => {
      if (scenario.fixture === "posRestaurantPage") {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      }
    };

    const testTitle = scenario.only ? "Executes specific rounding error case (focus)" : "Executes specific rounding error case";

    runTest(testTitle, async (page) => {
      test.setTimeout(120_000);
      
      const paymentUrlRegex = new RegExp(scenario.paymentUrl);
      const tc = scenario.caseData;

      await test.step(`Build cart with ${tc.productName}`, async () => {
        await selectClientByCedula(page, tc.clientCedula);
        await searchAndSelectProduct(page, { name: tc.productName });
        
        const dialog = await openProductOptions(page);

        if (tc.quantity !== undefined && tc.quantity !== null) {
          await setQuantityInOptions(page, dialog, tc.quantity);
        }

        if (tc.unitPriceWithoutTax !== undefined && tc.unitPriceWithoutTax !== null) {
          await setUnitPriceInOptions(page, dialog, tc.unitPriceWithoutTax, false);
        } else if (tc.unitPriceWithTax !== undefined && tc.unitPriceWithTax !== null) {
          await setUnitPriceInOptions(page, dialog, tc.unitPriceWithTax, true);
        }

        if (tc.discountPercentage !== undefined && tc.discountPercentage !== null && tc.discountPercentage > 0) {
          await setDiscountInOptions(page, dialog, tc.discountPercentage, "Porcentaje");
        } else if (tc.discountFixed !== undefined && tc.discountFixed !== null && tc.discountFixed > 0) {
          await setDiscountInOptions(page, dialog, tc.discountFixed, "Fijo");
        }

        await saveProductOptions(page, dialog);
      });

      await test.step("Proceed to payment screen", async () => {
        await page.getByRole("button", { name: /Terminar Venta/i }).click({ force: true });
        await page.waitForURL(paymentUrlRegex, { timeout: 30000 });
      });

      await test.step("Disable auto-print and auto-drawer features", async () => {
        const ensureActionButton = async (locator, shouldBeActive) => {
          await expect(locator).toHaveClass(/summary-action-btn--(active|inactive)/);
          const isActive = await locator.evaluate((el) => el.classList.contains("summary-action-btn--active"));
          if (isActive !== shouldBeActive) await locator.click();
        };

        const printTicketCard = page.locator(".summary-action-btn").filter({ hasText: /Imprimir/i }).first();
        const openDrawerCard  = page.locator(".summary-action-btn").filter({ hasText: /Abrir Gaveta/i }).first();
        if (await printTicketCard.isVisible()) await ensureActionButton(printTicketCard, false);
        if (await openDrawerCard.isVisible()) await ensureActionButton(openDrawerCard, false);
      });

      await test.step("Pay and verify rounding behavior", async () => {
        const methodOption = page.getByText(new RegExp(`^${scenario.paymentMethod}$`, 'i')).first();
        await methodOption.click();

        const finalizarVentaButton = page.getByRole("button", { name: /Finalizar Venta/i });

        // Configuramos los locators de los dos posibles resultados
        const successSnackbar = page.locator(".v-snackbar").filter({ hasText: /Venta Realizada/i }).first();
        const errorSnackbar = page.locator(".v-snackbar").filter({ hasText: /incorrectos|no coinciden/i }).first();

        await finalizarVentaButton.click({ force: true });

        // Esperamos hasta que aparezca CUALQUIERA de los dos mensajes (éxito o error)
        await expect(successSnackbar.or(errorSnackbar)).toBeVisible({ timeout: 15000 });

        // Si aparece el error, lanzamos un Error explícito para pintar la consola de Rojo
        if (await errorSnackbar.isVisible()) {
          const errorText = await errorSnackbar.textContent();
          throw new Error(`\n\n❌ ERROR DE REDONDEO (WS-1038): Falló porque no coinciden los valores.\nEl sistema dice: "${errorText.trim()}"\n\n`);
        }

        // Si llegamos aquí, el cobro fue exitoso
        await expect(successSnackbar).toBeVisible();
      });
    });
  });
});
