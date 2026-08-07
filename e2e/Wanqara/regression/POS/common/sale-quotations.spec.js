import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { withPath } from "../../../harness/urls.js";
import { SEED } from "../../../harness/seed.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { selectClientByCedula, openDrawer } from "../harness/pos-sale-flow.js";
import { completePayment } from "../harness/pos-payment.js";
import { getSessionPath } from "../../../harness/auth.js";

async function runQuoteFlow(page, { homePath, observacion, paymentTerms, pdfChoice }) {
  await page.goto(withPath(getTenantBaseUrl(), homePath));
  await page.waitForURL(new RegExp(homePath));

  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await page.getByPlaceholder("Ingresa Cédula o RUC").clear();

  await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });

  const cotizarButton = page.getByRole("button", { name: /Cotizar/i }).first();
  await cotizarButton.click();

  const guardarCotizacionButton = page.getByRole("button", { name: /Guardar Cotización/i }).first();
  await guardarCotizacionButton.click();

  const quoteModal = page.locator(".v-overlay__content").filter({ hasText: /Resumen de la cotización actual/i }).first();
  await expect(quoteModal).toBeVisible();

  await quoteModal.locator("textarea").nth(0).fill(observacion);
  await quoteModal.locator("textarea").nth(1).fill(paymentTerms);

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

const environments = [
  { name: 'Retail',     authType: 'retail',     fixture: 'posPage',           homePath: '/pos/home',            paymentUrl: /\/pos\/payments/ },
  { name: 'Restaurant', authType: 'restaurant', fixture: 'posRestaurantPage', homePath: '/pos/restaurant-home', paymentUrl: /\/pos\/restaurant-payments/ }
];

for (const env of environments) {
  test.describe.serial(`POS ${env.name} — Quotation Workflow @regression`, () => {
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(env.authType) });

    const runTest = (title, bodyFn) => {
      if (env.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    runTest("creates quotations with and without PDF generation", async (page) => {
      test.setTimeout(180_000);

      await test.step("Create a quotation with PDF", async () => {
        await runQuoteFlow(page, {
          homePath: env.homePath,
          observacion: SEED.sale.quoteObservation,
          paymentTerms: SEED.sale.quotePaymentTerms,
          pdfChoice: null,
        });
      });

      await test.step("Create a quotation without generating a PDF", async () => {
        await runQuoteFlow(page, {
          homePath: env.homePath,
          observacion: SEED.sale.quoteObservation,
          paymentTerms: SEED.sale.quotePaymentTerms,
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
        await page.waitForURL(env.paymentUrl);
        await completePayment(page);
      });
    });
  });
}