/* eslint-disable */
import fs from "fs";
interface QuoteParams {
  paymentMethod: string;
  [key: string]: any;
}
interface ScenarioData extends FlatScenario {
  businessType: string;
  quoteParams: QuoteParams;
}

import path from "path";
import { fileURLToPath } from "url";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { openDrawer } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-drawer-helpers.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-quotations.json"), "utf-8"))
);

async function runQuoteFlow(page: Page, { businessType, quoteParams, pdfChoice }: any) {
  const homePath = businessType === "Restaurante" ? "/pos/restaurant-home" : "/pos/home";
  
  await page.goto(homePath);
  await page.waitForURL(new RegExp(homePath));

  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await page.getByPlaceholder("Ingresa Cédula o RUC").clear();

  await selectClientByCedula(page, quoteParams.clientCedula);
  await searchAndSelectProduct(page, { name: quoteParams.productName });

  const cotizarButton = page.getByRole("button", { name: /Cotizar/i }).first();
  await cotizarButton.click();

  const guardarCotizacionButton = page.getByRole("button", { name: /Guardar Cotización/i }).first();
  await guardarCotizacionButton.click();

  const quoteModal = page.locator(".v-overlay__content").filter({ hasText: /Resumen de la cotización actual/i }).first();
  await expect(quoteModal).toBeVisible();

  await quoteModal.locator("textarea").nth(0).fill(quoteParams.observation);
  await quoteModal.locator("textarea").nth(1).fill(quoteParams.paymentTerms);

  if (pdfChoice) {
    await quoteModal.getByRole("radio", { name: pdfChoice }).click();
  }

  const saveQuoteButton = quoteModal.getByRole("button", { name: /Guardar esta Cotización/i });

  await Promise.all([
    page.waitForResponse(res =>
      res.url().endsWith('/api/v1/billing/quotes') &&
      res.request().method() === 'POST' &&
      res.status() === 201
    ),
    saveQuoteButton.click({ force: true })
  ]);

  await expect(page.locator(".v-snackbar").filter({ hasText: /Cotización Guardada/i })).toBeVisible();

  if (pdfChoice !== "No mostrar PDF") {
    await expect(page.locator(".pdf-page").first()).toBeVisible({ timeout: 30000 });
  }
}

async function navigateToConsumeQuotes(page: Page, drawer: any) {
  const option = drawer.locator("button, .v-card").filter({ hasText: /Recuperar Cotizaciones/i }).first();
  await option.click();
  await page.waitForURL(/\/pos\/consume-quotes/);
}

async function selectFirstQuoteAndBill(page: Page) {
  const quoteCard = page.locator(".tw-bg-background.dark\\:tw-bg-background-dark.tw-border").first();
  await quoteCard.click();

  const facturarBtn = page.getByRole("button", { name: /Facturar/i }).first();
  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/api/v1/billing/quotes/') &&
      res.request().method() === 'POST' &&
      res.status() === 200
    ),
    facturarBtn.click({ force: true })
  ]);

  await page.waitForURL(/\/pos\/(restaurant-)?home/);
  await expect(page.locator(".v-snackbar").filter({ hasText: /Se ha convertido la cotización/i })).toBeVisible();
}

test.describe("Quotation Workflow", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    
    test("creates quotations with and without PDF generation", async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);

      await test.step("Create a quotation with PDF", async () => {
        await runQuoteFlow(page, {
          businessType: scenario.businessType,
          quoteParams: scenario.quoteParams,
          pdfChoice: null,
        });
      });

      await test.step("Create a quotation without generating a PDF", async () => {
        await runQuoteFlow(page, {
          businessType: scenario.businessType,
          quoteParams: scenario.quoteParams,
          pdfChoice: "No mostrar PDF",
        });
      });
    });

    test("retrieves a pending quotation and completes the sale", async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);

      await test.step("Open the More Options menu and navigate to Retrieve Quotations", async () => {
        const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
        const drawer = await openDrawer(page, triggerLocator, /Opciones/i);
        await navigateToConsumeQuotes(page, drawer);
      });

      await test.step("Select the first quotation and convert it to an invoice", async () => {
        await selectFirstQuoteAndBill(page);
      });

      await test.step("Complete the sales workflow", async () => {
        const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
        await finishSaleButton.click();
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);
        await completePayment(page, { paymentMethod: scenario.quoteParams.paymentMethod });
      });
    });

  });
});
