import { expect, type Page, type Locator } from "@playwright/test";
import { selectClientFromSearchModal } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";

export interface ReceivableClientOptions {
  cedula: string;
}

export async function selectClientAndAccounts(page: Page, { cedula }: ReceivableClientOptions): Promise<void> {
  await selectClientFromSearchModal(page, cedula, {
    triggerLocator: page.getByRole("button", { name: /Buscar cliente/i })});

  const agregarCuentasBtn = page.getByRole("button", { name: /Agregar cuentas/i });
  await expect(agregarCuentasBtn).toBeEnabled();
  await agregarCuentasBtn.click();

  const modalCuentas = page.locator(".v-overlay__content").filter({ hasText: /Cuentas por cobrar/i }).first();
  await expect(modalCuentas).toBeVisible();

  const seleccionarPaginaBtn = modalCuentas.getByRole("button", { name: "Seleccionar página", exact: true });
  await expect(seleccionarPaginaBtn).toBeEnabled({ timeout: 15_000 });
  await seleccionarPaginaBtn.click();

  const confirmarBtn = modalCuentas.getByRole("button", { name: /Confirmar selección/i });
  await expect(confirmarBtn).toBeEnabled();
  await confirmarBtn.click();
  await expect(modalCuentas).toBeHidden();
}

export interface MultiplePaymentOptions {
  paymentAmount: string | number;
  paymentDescription: string;
}

export async function fillPaymentDetailsAndSubmit(page: Page, { paymentAmount, paymentDescription }: MultiplePaymentOptions): Promise<void> {
  const accountRows = page.locator(".multi-account-row");
  await expect(accountRows.first()).toBeVisible({ timeout: 10_000 });

  const rowCount = await accountRows.count();
  for (let i = 0; i < rowCount; i++) {
    const amountInput = accountRows.nth(i).locator("input").first();
    await amountInput.click();
    await amountInput.click();
    await amountInput.press("End");
    await amountInput.fill(String(paymentAmount));
    await amountInput.press("Tab");
  }

  const descriptionInput = page.getByRole("textbox", { name: /Agrega una Descripción al/i });
  await descriptionInput.click();
  await descriptionInput.fill(paymentDescription);
  await descriptionInput.press("Tab");

  const efectivoCard = page.locator(".multi-method-card").filter({ hasText: /^EFECTIVO$/i }).first();
  await efectivoCard.click();

  const pagarBtn = page.getByRole("button", { name: /^Pagar$/i, exact: true });
  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/api/v1/accounting/payments/pay-multiple-receivable-accounts') && res.status() === 200
    ),
    pagarBtn.click()
  ]);

  const successMessage = page.locator(".v-snackbar").filter({ hasText: /Abonos creados correctamente/i }).first();
  await expect(successMessage).toBeVisible();
}

export interface SingleReceivablePaymentOptions {
  amount: string | number;
  description: string;
  paymentMethodRegex: RegExp | string;
}

export async function fillSingleReceivablePayment(page: Page, { amount, description, paymentMethodRegex }: SingleReceivablePaymentOptions): Promise<Locator> {
  const descriptionInput = page.getByPlaceholder("Agrega una Descripción al Abono");
  await expect(descriptionInput).toBeVisible();
  await descriptionInput.fill(description);

  const methodOption = page.getByText(paymentMethodRegex).first();
  await expect(methodOption).toBeVisible();
  await methodOption.click();

  const amountInput = page.getByPlaceholder("Cantidad");
  await expect(amountInput).toBeVisible();
  await amountInput.click();
  await amountInput.fill(String(amount));
  await amountInput.press("Tab");

  const pagarBtn = page.getByRole("button", { name: /^Pagar$/i, exact: true });
  await expect(pagarBtn).toBeEnabled();
  return pagarBtn;
}

export async function searchReceivableAccount(page: Page, searchTerm: string): Promise<void> {
  const searchInput = page.getByRole("textbox", { name: /Busca lo que necesites/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  
  await searchInput.click();
  await searchInput.clear();

  await Promise.all([
    page.waitForResponse(res => 
      (res.url().includes('account') || res.url().includes('receivable')) && 
      res.request().method() === 'GET' && 
      res.url().includes(encodeURIComponent(searchTerm))
    ),
    searchInput.fill(searchTerm)
  ]);
}

export interface DeletionReasonOptions {
  initialDeleteReason?: string;
  finalDeleteReason?: string;
}

export async function validateInitialDeletionError(page: Page, { initialDeleteReason }: DeletionReasonOptions): Promise<void> {
  const deletePaymentBtn = page.locator("tbody tr").last().locator("button.text-red, button.tw-text-red-500").last();
  await deletePaymentBtn.click();

  const modal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
  await expect(modal).toBeVisible();

  if (initialDeleteReason) {
    const reasonInput = modal.getByRole("textbox", { name: /Motivo de eliminación/i });
    await reasonInput.fill(initialDeleteReason);
  }

  const confirmDeleteBtn = modal.getByRole("button", { name: /Eliminar Abono/i });
  await confirmDeleteBtn.click();

  const specificErrorMessage = modal.getByText(/No es posible anular este|Anula desde el detalle/i).first();
  await expect(specificErrorMessage).toBeVisible({ timeout: 10_000 });
}

export async function navigateToSettlementDetails(page: Page): Promise<void> {
  const modal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
  const irAlDetalleBtn = modal.getByRole("button", { name: /Ir al detalle/i });
  
  await expect(irAlDetalleBtn).toBeVisible();
  await irAlDetalleBtn.click();
}

export async function generateAndViewPDF(page: Page): Promise<void> {
  const generatePdfBtn = page.getByRole("button", { name: /^Generar PDF$/i }).first();
  await expect.soft(generatePdfBtn).toBeVisible({ timeout: 10_000 });

  await Promise.all([
    page.waitForResponse(res => res.url().includes('/voucher-payment-account-detail') && res.status() === 200),
    generatePdfBtn.click()
  ]);

  const pdfViewerModal = page.locator(".v-overlay__content").filter({ has: page.locator(".pdf-viewer-card") }).first();
  await expect.soft(pdfViewerModal).toBeVisible({ timeout: 15_000 });
  
  const renderedPdfPage = pdfViewerModal.locator(".pdf-page").first();
  await expect.soft(renderedPdfPage).toBeVisible({ timeout: 20_000 });

  const closePdfBtn = pdfViewerModal.getByRole("button", { name: /^Cerrar$/i });
  await closePdfBtn.click();
  await expect.soft(pdfViewerModal).toBeHidden();
}

export async function confirmFinalDeletion(page: Page, { finalDeleteReason }: DeletionReasonOptions): Promise<void> {
  const deleteSettlementBtn = page.getByRole("button", { name: /^Eliminar Abono$/i }).last();
  await expect(deleteSettlementBtn).toBeVisible();
  await deleteSettlementBtn.click();

  const deleteModal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
  await expect(deleteModal).toBeVisible();

  if (finalDeleteReason) {
    const reasonInput = deleteModal.getByRole("textbox", { name: /Motivo de eliminación/i });
    await reasonInput.click();
    await reasonInput.fill(finalDeleteReason);
  }

  const confirmDeleteBtn = deleteModal.getByRole("button", { name: /^Eliminar Abono$/i });

  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/api/v1/accounting/account-payment-settlements/') &&
      res.url().includes('/delete') && res.status() === 200
    ),
    confirmDeleteBtn.click()
  ]);

  const successMessage = page.locator(".v-snackbar").filter({ hasText: /Abono eliminado exitosamente/i }).first();
  await expect(successMessage).toBeVisible();
}

export interface PrintTicketOptions {
  paymentAmount: string | number;
}

export async function printPaymentTicket(page: Page, { paymentAmount }: PrintTicketOptions): Promise<void> {
  const printBtn = page.locator("tbody tr").last().locator("button").nth(1);

  const printerPromise = page.waitForRequest(req => 
    req.url().includes('/receiptPrinter/payment-ticket') && 
    req.method() === 'POST'
  );

  await printBtn.click();
  const printerRequest = await printerPromise;
  const postData = printerRequest.postDataJSON() as Record<string, unknown>;

  const amounts: string[] = [];
  function extractAmounts(obj: unknown) {
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'amount') {
          amounts.push(String(value));
        } else {
          extractAmounts(value);
        }
      }
    }
  }
  extractAmounts(postData);

  const formattedAmounts = amounts.map(a => parseFloat(a).toFixed(2));
  const targetAmount = parseFloat(String(paymentAmount)).toFixed(2);
  
  console.log("Montos encontrados en la petición a la impresora:", formattedAmounts);
  
  expect.soft(
    formattedAmounts, 
    `El payload enviado a la impresora no incluye el monto esperado de ${targetAmount}`
  ).toContain(targetAmount);

  const successToast = page.getByRole('status').locator('div').filter({ hasText: /Impresión exitosa/i }).first();
  await expect(successToast).toBeVisible({ timeout: 15_000 });
}
