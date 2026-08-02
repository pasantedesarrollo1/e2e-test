import { test, expect } from "../../regression/harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import { withPath } from "../../harness/urls.js";
import { SEED } from "../../harness/seed.js";
import { searchAndSelectProduct } from "../../regression/harness/pos-search.js";
import { selectClientByCedula, openDrawer } from "../../regression/harness/pos-sale-flow.js";
import { completePayment } from "../../regression/harness/pos-payment.js";

test.describe.configure({ mode: "serial" });

async function runQuoteFlow(page, { observacion, paymentTerms, pdfChoice }) {
  await page.goto(withPath(getTenantBaseUrl(), "/pos/restaurant-home"));
  await page.waitForURL(/\/pos\/restaurant-home/);

  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await page.getByPlaceholder("Ingresa Cédula o RUC").clear();

  await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);

  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });

  const cotizarButton = page.getByRole("button", { name: /Cotizar/i }).first();
  await cotizarButton.click();

  const guardarCotizacionButton = page
    .getByRole("button", { name: /Guardar Cotización/i })
    .first();
  await guardarCotizacionButton.click();

  const quoteModal = page
    .locator(".v-overlay__content")
    .filter({ hasText: /Resumen de la cotización actual/i })
    .first();
  await expect(quoteModal).toBeVisible();

  const observationField = quoteModal.locator("textarea").nth(0);
  await observationField.fill(observacion);

  const paymentTermsField = quoteModal.locator("textarea").nth(1);
  await paymentTermsField.fill(paymentTerms);

  if (pdfChoice) {
    const pdfRadio = quoteModal.getByRole("radio", { name: pdfChoice });
    await pdfRadio.click();
  }

  const saveQuoteButton = quoteModal.getByRole("button", {
    name: /Guardar esta Cotización/i,
  });

  await Promise.all([
    page.waitForResponse(res =>
      res.url().endsWith("/api/v1/billing/quotes") &&
      res.request().method() === "POST" &&
      res.status() === 201
    ),
    saveQuoteButton.click({ force: true }),
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Cotización Guardada/i }),
  ).toBeVisible();

  if (pdfChoice !== "No mostrar PDF") {
    await expect(page.locator(".pdf-page").first()).toBeVisible({ timeout: 30000 });
  }
}

async function navigateToConsumeQuotes(page, drawer) {
  const option = drawer
    .locator("button, .v-card")
    .filter({ hasText: /Recuperar Cotizaciones/i })
    .first();
  await option.click();
  await page.waitForURL(/\/pos\/consume-quotes/);
}

async function selectFirstQuoteAndBill(page) {
  const quoteCard = page
    .locator(".tw-bg-background.dark\\:tw-bg-background-dark.tw-border")
    .first();
  await quoteCard.click();

  const facturarBtn = page.getByRole("button", { name: /Facturar/i }).first();

  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes("/api/v1/billing/quotes/") &&
      res.request().method() === "POST" &&
      res.status() === 200
    ),
    facturarBtn.click({ force: true }),
  ]);

  await page.waitForURL(/\/pos\/restaurant-home/);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Se ha convertido la cotización/i }),
  ).toBeVisible();
}

async function completeSaleFromQuote(page) {
  const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
  await finishSaleButton.click();
  await page.waitForURL(/\/pos\/restaurant-payments/);
  await completePayment(page);
}

test.describe("POS Restaurant — Quotation Workflow @release", () => {
  requirePosCredentials(test);

  test("creates quotations with and without PDF generation", async ({ posRestaurantPage: page }) => {
    test.setTimeout(180_000);

    await test.step("Create a quotation with PDF", async () => {
      await runQuoteFlow(page, {
        observacion: SEED.sale.quoteObservation,
        paymentTerms: SEED.sale.quotePaymentTerms,
        pdfChoice: null,
      });
    });

    await test.step("Create a quotation without generating a PDF", async () => {
      await runQuoteFlow(page, {
        observacion: SEED.sale.quoteObservation,
        paymentTerms: SEED.sale.quotePaymentTerms,
        pdfChoice: "No mostrar PDF",
      });
    });
  });

test("retrieves a pending quotation and completes the sale", async ({ posRestaurantPage: page }) => {
  test.info().annotations.push({
    type: "issue",
    description: "https://wanqara-team.atlassian.net/browse/WS-910",
  });

  test.fixme(
    true, 
    "Bypass temporal (WS-910): La venta tras recuperar una cotización no puede completarse en el POS Restaurant."
  );

  test.setTimeout(180_000);

  await test.step("Open the More Options menu and navigate to Retrieve Quotations", async () => {
    const drawerFilter = /Opciones/i;
    const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
    const drawer = await openDrawer(page, triggerLocator, drawerFilter);
    await navigateToConsumeQuotes(page, drawer);
  });

  await test.step("Select the first quotation and convert it to an invoice", async () => {
    await selectFirstQuoteAndBill(page);
  });

  await test.step("Complete the sales workflow", async () => {
    await completeSaleFromQuote(page);
  });
});
});