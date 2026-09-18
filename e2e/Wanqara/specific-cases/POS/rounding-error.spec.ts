/* eslint-disable */
interface CaseData { [key: string]: any; }
interface ScenarioData extends FlatScenario { paymentUrl: string; paymentMethod: string; caseData: CaseData; client: string; }
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import {
  openProductOptions,
  saveProductOptions,
  setDiscountInOptions,
  setQuantityInOptions,
  setUnitPriceInOptions
} from "@/e2e/Wanqara/regression/POS/harness/products/pos-product-options.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

import scenariosRaw from "./0-json-data/rounding-error.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];

test.describe.serial("POS Specific Cases - Rounding Errors", () => {
  requirePosCredentials(test);

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    const runTest = (title: string, bodyFn: any) => {
      test(title, async ({ posEnvironment }) => await bodyFn(posEnvironment.page));
    };

    const testTitle = scenario.only ? "Executes specific rounding error case (focus)" : "Executes specific rounding error case";

    runTest(testTitle, async (page: any) => {
      test.setTimeout(120_000);
      
      const paymentUrlRegex = (new RegExp(scenario.paymentUrl) as any);
      const tc = scenario.caseData;

      await test.step(`Build cart with ${tc.productName}`, async () => {
        await selectClientByCedula(page, tc.clientCedula as string);
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
        const ensureActionButton = async (locator: any, shouldBeActive: any) => {
          await expect(locator).toHaveClass(/summary-action-btn--(active|inactive)/);
          const isActive = await locator.evaluate((el: any) => el.classList.contains("summary-action-btn--active"));
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

        const successSnackbar = page.locator(".v-snackbar").filter({ hasText: /Venta Realizada/i }).first();
        const errorSnackbar = page.locator(".v-snackbar").filter({ hasText: /incorrectos|no coinciden/i }).first();

        await finalizarVentaButton.click({ force: true });

        await expect(successSnackbar.or(errorSnackbar)).toBeVisible({ timeout: 15000 });

        if (await errorSnackbar.isVisible()) {
          const errorText = await errorSnackbar.textContent();
          throw new Error(`\n\n❌ ERROR DE REDONDEO (WS-1038): Falló porque no coinciden los valores.\nEl sistema dice: "${errorText.trim()}"\n\n`);
        }

        await expect(successSnackbar).toBeVisible();
      });
    });
  });
});
