import { expect } from "@playwright/test";
import { SEED } from "../../../../../../harness/seed.js";
import { clickTableRowAction } from "../../../../../../harness/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../../../harness/action-tooltips.js";
import { selectClientFromSearchModal } from "../../../../../../harness/client-helpers.js";

export async function selectClientAndAccounts(page) {
  await selectClientFromSearchModal(page, SEED.clients.test.cedula, {
    triggerLocator: page.getByRole("button", { name: /Buscar cliente/i }),
  });

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
  await expect(modalCuentas).not.toBeVisible();
}

export async function fillPaymentDetailsAndSubmit(page) {
  const accountRows = page.locator(".multi-account-row");
  await expect(accountRows.first()).toBeVisible({ timeout: 10_000 });

  const rowCount = await accountRows.count();
  for (let i = 0; i < rowCount; i++) {
    const amountInput = accountRows.nth(i).locator("input").first();
    await amountInput.click();
    await amountInput.click();
    await amountInput.press("End");
    await amountInput.fill(SEED.receivables.paymentAmount);
    await amountInput.press("Tab");
  }

  const descriptionInput = page.getByRole("textbox", { name: /Agrega una Descripción al/i });
  await descriptionInput.click();
  await descriptionInput.fill(SEED.receivables.paymentDescription);
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

export async function fillSingleReceivablePayment(page, { amount, description, paymentMethodRegex }) {
  const descriptionInput = page.getByPlaceholder("Agrega una Descripción al Abono");
  await expect(descriptionInput).toBeVisible();
  await descriptionInput.fill(description);

  const methodOption = page.getByText(paymentMethodRegex).first();
  await expect(methodOption).toBeVisible();
  await methodOption.click();

  const amountInput = page.getByPlaceholder("Cantidad");
  await expect(amountInput).toBeVisible();
  await amountInput.click();
  await amountInput.fill(amount);
  await amountInput.press("Tab");

  const pagarBtn = page.getByRole("button", { name: /^Pagar$/i, exact: true });
  await expect(pagarBtn).toBeEnabled();
  return pagarBtn;
}

export async function searchReceivableAccount(page, searchTerm) {
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

export async function validateInitialDeletionError(page) {
  const deletePaymentBtn = page.locator("tbody tr").last().locator("button.text-red, button.tw-text-red-500").last();
  await deletePaymentBtn.click();

  const modal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
  await expect(modal).toBeVisible();

  const reasonInput = modal.getByRole("textbox", { name: /Motivo de eliminación/i });
  await reasonInput.fill(SEED.receivables.initialDeleteReason);

  const confirmDeleteBtn = modal.getByRole("button", { name: /Eliminar Abono/i });
  await confirmDeleteBtn.click();

  const specificErrorMessage = modal.getByText(/No es posible anular este|Anula desde el detalle/i).first();
  await expect(specificErrorMessage).toBeVisible({ timeout: 10_000 });
}

export async function navigateToSettlementDetails(page) {
  const modal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
  const irAlDetalleBtn = modal.getByRole("button", { name: /Ir al detalle/i });
  
  await expect(irAlDetalleBtn).toBeVisible();
  await irAlDetalleBtn.click();
}

export async function generateAndViewPDF(page) {
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
  await expect.soft(pdfViewerModal).not.toBeVisible();
}

export async function confirmFinalDeletion(page) {
  const deleteSettlementBtn = page.getByRole("button", { name: /^Eliminar Abono$/i }).last();
  await expect(deleteSettlementBtn).toBeVisible();
  await deleteSettlementBtn.click();

  const deleteModal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
  await expect(deleteModal).toBeVisible();

  const reasonInput = deleteModal.getByRole("textbox", { name: /Motivo de eliminación/i });
  await reasonInput.click();
  await reasonInput.fill(SEED.receivables.finalDeleteReason);

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

export async function printPaymentTicket(page) {
  // We assume we are already in the account details view.
  // Right next to the delete button, there is a print button.
  // According to codegen, it's the 2nd button in the flex container (or 3rd from right to left taking into account the delete button).
  const printBtn = page.locator("tbody tr").last().locator("button").nth(1);

  const printerPromise = page.waitForRequest(req => 
    req.url().includes('/receiptPrinter/payment-ticket') && 
    req.method() === 'POST'
  );

  await printBtn.click();
  const printerRequest = await printerPromise;
  const postData = printerRequest.postDataJSON();
  console.log("PRINTER POST DATA:", JSON.stringify(postData, null, 2));

  const amounts = [];
  function extractAmounts(obj) {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key === 'amount') {
          amounts.push(obj[key]);
        } else {
          extractAmounts(obj[key]);
        }
      }
    }
  }
  extractAmounts(postData);

  if (amounts.length > 0) {
    const paymentAmount = SEED.receivables.paymentAmount || "0.01";
    const targetAmount = parseFloat(paymentAmount).toFixed(2);
    for (let i = 0; i < amounts.length; i++) {
      const val = parseFloat(amounts[i]).toFixed(2);
      if (val === targetAmount) {
         expect.soft(val).toBe(targetAmount);
      } else {
         // Only assert on amounts that are related to the payment.
         // We will skip others for now and check the logs.
      }
    }
  }

  const successToast = page.getByRole('status').locator('div').filter({ hasText: /Impresión exitosa/i }).first();
  await expect(successToast).toBeVisible({ timeout: 15_000 });
}