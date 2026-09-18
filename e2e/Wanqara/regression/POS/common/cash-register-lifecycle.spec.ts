/* eslint-disable */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

interface ScenarioData extends FlatScenario {
  subsidiaryName: string;
  openingAmount: string;
  basePath: string;
  clientCedula: string;
  productName: string;
  paymentMethod: string;
}

import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { closeCashRegister } from "@/e2e/Wanqara/regression/POS/harness/cash-register/cash-register-helpers.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { clickFinishSale } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios: ScenarioData[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "cash-register-lifecycle.json"), "utf-8")
);

test.describe("POS - Cash Register Lifecycle @regression", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario) => {
    test(scenario.description, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);
      
      const subsidiaryName = scenario.subsidiaryName;

      await test.step("Abrir la caja (Punto de emisión y monto)", async () => {
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
          page.waitForResponse((res: any) => res.url().includes('cash-registers') && res.request().method() === 'POST'),
          abrirCajaBtn.click()
        ]);

        await page.waitForURL(new RegExp(scenario.basePath));
      });

      await test.step("Realizar venta de prueba", async () => {
        await selectClientByCedula(page, scenario.clientCedula);
        await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: undefined });
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
