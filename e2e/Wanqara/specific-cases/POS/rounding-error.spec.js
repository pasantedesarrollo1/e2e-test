import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated, withSessionWatchdog } from "../../harness/helpers/auth.js";
import { SEED } from "../../harness/config/seed.js";
import { ensureCashRegisterOpen } from "../../regression/POS/harness/cash-register-helpers.js";
import { searchAndSelectProduct } from "../../regression/POS/harness/pos-search.js";
import { selectClientByCedula } from "../../harness/helpers/client-helpers.js";
import {
  openProductOptions,
  setQuantityInOptions,
  setUnitPriceInOptions,
  setDiscountInOptions,
  saveProductOptions,
} from "../../regression/POS/harness/pos-product-options.js";

import scenarios from "./0-json-data/rounding-error.json" assert { type: "json" };

test.describe("POS Specific Cases - Rounding Errors", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(
        scenario.only ? "Executes specific rounding error case (focus)" : "Executes specific rounding error case",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(120_000);
          
          const paymentUrlRegex = new RegExp(scenario.paymentUrl);
          const tc = scenario.caseData;
          const tenantBaseUrl = getTenantBaseUrl();

          await test.step("Setup POS Environment dynamically", async () => {
            const isRestaurant = scenario.fixture === "posRestaurantPage";
            const targetPath = isRestaurant ? "/pos/restaurant-home" : "/pos/home";
            const subsidiaryName = isRestaurant ? SEED.subsidiaries.restaurant.name : SEED.subsidiaries.retail.name;
            
            await ensureAuthenticated(page, { tenantBaseUrl, targetPath, authType: scenario.authType });
            await ensureCashRegisterOpen(page, tenantBaseUrl, "10", subsidiaryName);
            await withSessionWatchdog(page, () =>
              expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 60_000 }),
              scenario.authType
            );
          });

          await test.step(`Build cart with ${tc.productName}`, async () => {
            await selectClientByCedula(page, "0000000001");
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
            const methodOption = page.getByText(SEED.paymentMethods.efectivo.label, { exact: true }).first();
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
        }
      );
    });
  }
});
