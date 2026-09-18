/* eslint-disable */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface CartParams {
  productName: string;
  restrictedAmount: string;
  testClientCedula: string;
  dynamicDocumentType?: string;
  paymentMethod?: string;
}

interface ScenarioData extends ScenarioDefinition, TestMetadata {
  cartParams: CartParams;
  includeDynamicDocumentTest?: boolean;
}

import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { clickFinishSale, selectDocumentTypePos } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios: ScenarioData[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cart.json"), "utf-8")
);

async function addStandardProduct(page: Page, productName: any) {
  await searchAndSelectProduct(page, { name: productName });
}

async function verifyEmptyCart(page: Page) {
  await expect(page.getByText("No hay productos seleccionados")).toBeVisible();
}

async function removeProductViaTrashIcon(page: Page) {
  await page.locator(".v-btn.v-btn--flat.v-theme--BLUE_THEME.text-red").first().click();
}

test.describe("POS Cart Operations and Sale Validations", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario) => {
    
    test(`handles product removal and cart clearing in sale mode`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(60_000);

      await test.step("Add a product and remove it via the trash icon", async () => {
        await addStandardProduct(page, scenario.cartParams.productName);
        await removeProductViaTrashIcon(page);
        await verifyEmptyCart(page);
      });

      await test.step("Add a product and clear the sale", async () => {
        await addStandardProduct(page, scenario.cartParams.productName);
        await page.getByRole("button", { name: /Limpiar Venta/i }).click();
        await verifyEmptyCart(page);
      });
    });

    test(`handles product removal and cart clearing in quote mode`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(60_000);

      await test.step("Add a product, switch to quote mode, and remove it via the trash icon", async () => {
        await addStandardProduct(page, scenario.cartParams.productName);
        await page.getByRole("button", { name: /Cotizar/i }).click();
        await expect(page.getByRole("button", { name: /Limpiar Cotización/i })).toBeVisible();
        await removeProductViaTrashIcon(page);
        await verifyEmptyCart(page);
      });

      await test.step("Add a product, switch to quote mode, and clear the quotation", async () => {
        await addStandardProduct(page, scenario.cartParams.productName);
        const cotizarBtn = page.getByRole("button", { name: /Cotizar/i });
        const limpiarCotizacion = page.getByRole("button", { name: /Limpiar Cotización/i });
        if (!await limpiarCotizacion.isVisible()) {
          await cotizarBtn.click();
        }
        await expect(limpiarCotizacion).toBeVisible();
        await limpiarCotizacion.click();
        await verifyEmptyCart(page);
      });
    });

    test(`assigns a real client when sale total exceeds $50`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      await test.step("Add product and set quantity above $50", async () => {
        await addStandardProduct(page, scenario.cartParams.productName);
        const amountInput = page.locator("input[inputmode='decimal']").first();
        await amountInput.fill(scenario.cartParams.restrictedAmount);
        await amountInput.press("Tab");
      });

      await test.step("Verify total exceeds $50 and assign a real client", async () => {
        const totalText = await page.locator(".tw-text-3xl").first().innerText();
        const total = parseFloat(totalText.replace(/[^0-9.]/g, ""));
        if (total >= 50) {
          await selectClientByCedula(page, scenario.cartParams.testClientCedula);
        }
      });

      await test.step("Verify sale can proceed to checkout", async () => {
        await page.getByRole("button", { name: /Terminar Venta/i }).click();
        const snackbar = page.locator(".v-snackbar").filter({
          hasText: /No pueden generarse ventas por más de 50\$/i,
        });
        const isBlocked = await snackbar.isVisible();
        if (isBlocked) {
          await selectClientByCedula(page, scenario.cartParams.testClientCedula);
          await page.getByRole("button", { name: /Terminar Venta/i }).click();
        }
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);
      });
    });

    if (scenario.includeDynamicDocumentTest) {
      test(`completes a sale using a dynamic document type for a standard product`, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
        test.setTimeout(120_000);
        await selectDocumentTypePos(page, scenario.cartParams.dynamicDocumentType);
        await searchAndSelectProduct(page, { name: scenario.cartParams.productName, searchTerm: undefined });
        await clickFinishSale(page);
        await completePayment(page, { paymentMethod: scenario.cartParams.paymentMethod });
      });
    }
  });
});
