import { test, expect } from "../../../../regression/POS/harness/pos-fixtures.js";
import { requirePosCredentials } from "../../../../harness/settings.js";
import { getSessionPath } from "../../../../harness/auth.js";
import { SEED } from "../../../../harness/seed.js";
import { searchAndSelectProduct } from "../../../../regression/POS/harness/pos-search.js";
import { selectClientByCedula } from "../../../../harness/client-helpers.js";
import {
  openProductOptions,
  setQuantityInOptions,
  setUnitPriceInOptions,
  setDiscountInOptions,
  saveProductOptions,
} from "../../../../regression/POS/harness/pos-product-options.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const roundingCases = JSON.parse(fs.readFileSync(path.join(__dirname, "../../rounding-cases.json"), "utf8"));

const TICKET = {
  ws: 'WS-1038',
  tes: 'TES-220',
  release: '7.10.0',
  summary: 'Rounding error on POS sales checkout',
  addedToRegression: 'true',
};

const env = { name: 'Retail', authType: 'retail', fixture: 'posPage', paymentUrl: /\/pos\/payments/ };

test.describe(`POS Sales Rounding Error Cases - ${env.name} @release`, () => {
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath(env.authType) });

  for (const tc of roundingCases) {
    const testTitle = tc.ticket ? `Reproduction of ${tc.caseName} ${tc.ticket}` : `Reproduction of ${tc.caseName}`;
    test(testTitle, async ({ posPage: page }) => {
      test.setTimeout(120_000);

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

      await page.getByRole("button", { name: /Terminar Venta/i }).click({ force: true });
      await page.waitForURL(env.paymentUrl);

      // Disable print, drawer, pdf
      const ensureActionButton = async (locator, shouldBeActive) => {
        await expect(locator).toHaveClass(/summary-action-btn--(active|inactive)/);
        const isActive = await locator.evaluate((el) => el.classList.contains("summary-action-btn--active"));
        if (isActive !== shouldBeActive) await locator.click();
      };

      const printTicketCard = page.locator(".summary-action-btn").filter({ hasText: /Imprimir/i }).first();
      const openDrawerCard  = page.locator(".summary-action-btn").filter({ hasText: /Abrir Gaveta/i }).first();
      if (await printTicketCard.isVisible()) await ensureActionButton(printTicketCard, false);
      if (await openDrawerCard.isVisible()) await ensureActionButton(openDrawerCard, false);

      const methodOption = page.getByText(SEED.paymentMethods.efectivo.label, { exact: true }).first();
      await methodOption.click();

      const finalizarVentaButton = page.getByRole("button", { name: /Finalizar Venta/i });

      if (tc.expectedPaymentError) {
        await finalizarVentaButton.click();
        
        const snackbar = page.locator(".v-snackbar").filter({ hasText: /incorrectos/i }).first();
        await expect(snackbar).toBeVisible({ timeout: 10000 });

        const cashAmountInput = page.getByLabel("Monto", { exact: false }).first();
        await cashAmountInput.click();
        await cashAmountInput.fill(tc.fallbackPaymentAmount.toString());

        await Promise.all([
          page.waitForResponse(res => res.url().includes('/api/v2/pos/sales') && res.request().method() === 'POST' && res.status() === 200),
          finalizarVentaButton.click({ force: true })
        ]);
        
        const successSnackbar = page.locator(".v-snackbar").filter({ hasText: /Venta Realizada/i }).first();
        await expect(successSnackbar).toBeVisible({ timeout: 15000 });
      } else {
        await Promise.all([
          page.waitForResponse(res => res.url().includes('/api/v2/pos/sales') && res.request().method() === 'POST' && res.status() === 200),
          finalizarVentaButton.click({ force: true })
        ]);
        const successSnackbar = page.locator(".v-snackbar").filter({ hasText: /Venta Realizada/i }).first();
        await expect(successSnackbar).toBeVisible({ timeout: 15000 });
      }
    });
  }
});
