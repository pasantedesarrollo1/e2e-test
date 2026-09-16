import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests } from "../../../harness/helpers/test-generator.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { closeCashRegister } from "../harness/cash-register/cash-register-helpers.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from '../harness/sales/pos-checkout-helpers.js';
import { expect, test } from "../../../harness/builders/pos.builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "cash-register-lifecycle.json"), "utf-8")
);

test.describe("POS - Cash Register Lifecycle @regression", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    test(scenario.description, async ({ posPage: page }) => {
      test.setTimeout(180_000);
      
      const subsidiaryName = scenario.subsidiaryName;

      await test.step("Abrir la caja (Punto de emisión y monto)", async () => {
        // En este punto, el builder con cashRegisterMode='ensure-closed' ya nos entregó la UI
        // lista en la pantalla de "Abrir Caja" (o de seleccionar sucursal si hay varias).
        const subsidiaryCards = page.locator('.v-card').filter({ hasText: subsidiaryName });
        if (await subsidiaryCards.first().isVisible({ timeout: 4000 })) {
          await subsidiaryCards.first().click();
          const continuarBtn = page.getByRole("button", { name: /Continuar/i });
          if (await continuarBtn.isVisible()) {
            await continuarBtn.click();
          }
        }

        await expect(page.getByText('Puntos de Emisión disponibles')).toBeVisible();
        await expect(page.getByText('Seleccione el punto de Emisión')).toBeVisible();

        const specificCheckout = page.locator('.v-card.hover\\:tw-bg-gray-200').first();
        await expect(specificCheckout).toBeVisible();
        await specificCheckout.click();

        const montoInput = page.locator('input[type="number"]').first();
        await montoInput.fill(scenario.openingAmount);

        const abrirCajaBtn = page.getByRole("button", { name: /Abrir Caja/i }).first();
        await Promise.all([
          page.waitForResponse(res => res.url().includes('cash-registers') && res.request().method() === 'POST'),
          abrirCajaBtn.click()
        ]);

        await page.waitForURL(new RegExp(scenario.basePath));
      });

      await test.step("Realizar venta de prueba", async () => {
        await selectClientByCedula(page, scenario.clientCedula);
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: null });
        await clickFinishSale(page);
        await completePayment(page, { paymentMethod: scenario.paymentMethod });
        
        await page.goto(scenario.basePath);
        await page.waitForURL(new RegExp(scenario.basePath));
      });

      await test.step("Cierre de caja con validación de monto", async () => {
        await closeCashRegister(page, {
          beforeConfirm: async () => {
            await expect(page.getByText('Apertura :')).toBeVisible();
            await expect(page.locator('span').filter({ hasText: scenario.openingAmount }).first()).toBeVisible();
          }
        });
      });
    });
  });
});
