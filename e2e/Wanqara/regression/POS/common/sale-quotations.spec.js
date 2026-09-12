import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { withPath } from "../../../harness/config/urls.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { selectClientByCedula, openDrawer } from "../harness/pos-sale-flow.js";
import { completePayment } from "../harness/pos-payment.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-quotations.json"), "utf-8")
);


async function runQuoteFlow(page, { homePath, quoteParams, pdfChoice }) {
  await page.goto(withPath(getTenantBaseUrl(), homePath));
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

async function navigateToConsumeQuotes(page, drawer) {
  const option = drawer.locator("button, .v-card").filter({ hasText: /Recuperar Cotizaciones/i }).first();
  await option.click();
  await page.waitForURL(/\/pos\/consume-quotes/);
}

async function selectFirstQuoteAndBill(page) {
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

for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Quotation Workflow @${scenario.metadata?.testScope || 'regression'}`, () => {
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

    runTest("creates quotations with and without PDF generation", async (page) => {
      test.setTimeout(180_000);

      await test.step("Create a quotation with PDF", async () => {
        await runQuoteFlow(page, {
          homePath: scenario.homePath,
          quoteParams: scenario.quoteParams,
          pdfChoice: null,
        });
      });

      await test.step("Create a quotation without generating a PDF", async () => {
        await runQuoteFlow(page, {
          homePath: scenario.homePath,
          quoteParams: scenario.quoteParams,
          pdfChoice: "No mostrar PDF",
        });
      });
    });

    runTest("retrieves a pending quotation and completes the sale", async (page) => {
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
        await page.waitForURL(new RegExp(scenario.paymentUrlPattern));
        await completePayment(page);
      });
    });
  });
}
