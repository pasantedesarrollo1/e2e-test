import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../harness/auth.js";
import { SEED, getElectronicInvoicingAuthType } from "../harness/seed.js";
import { clickTableRowAction } from "../harness/crud-helpers.js";

const tenantBaseUrl = getTenantBaseUrl();
const authType001 = getElectronicInvoicingAuthType(); 

test.describe("Admin Payments — Multiple Receivables @release", () => {
  requirePosCredentials(test);
  
  test.use({ storageState: getSessionPath(authType001) });

  test("Selects a client, adds multiple receivables, processes payment, views PDF and validates deletion", async ({ page }) => {
    test.setTimeout(120_000);

    await test.step("Navigate to multiple receivables route", async () => {
      await ensureAuthenticated(page, { 
        tenantBaseUrl, 
        targetPath: "/admin/payments/add/multiple-receivables", 
        authType: authType001 
      });
    });

    await test.step("Open client modal and search for specific client", async () => {
      const buscarClienteBtn = page.getByRole("button", { name: /Buscar cliente/i });
      await expect(buscarClienteBtn).toBeVisible();
      await buscarClienteBtn.click();

      const searchInput = page.getByRole("textbox", { name: /Busca lo que necesites/i });
      await expect(searchInput).toBeVisible();
      await searchInput.fill(SEED.clients.test.cedula);
      await page.waitForTimeout(500); 

      const clienteRow = page.locator(".v-data-table__tr").filter({ hasText: SEED.clients.test.cedula }).first();
      await expect(clienteRow).toBeVisible({ timeout: 10_000 });
      await clienteRow.click();
      
      await expect(page.getByRole("button", { name: /Cambiar cliente/i })).toBeVisible();
    });

    await test.step("Open the receivables selector", async () => {
      const agregarCuentasBtn = page.getByRole("button", { name: /Agregar cuentas/i });
      await expect(agregarCuentasBtn).toBeEnabled();
      await agregarCuentasBtn.click();
    });

    await test.step("Select all accounts on the page and confirm", async () => {
      const modalCuentas = page.locator(".v-overlay__content").filter({ hasText: /Cuentas por cobrar/i }).first();
      await expect(modalCuentas).toBeVisible();

      const seleccionarPaginaBtn = modalCuentas.getByRole("button", { name: "Seleccionar página", exact: true });
      await expect(seleccionarPaginaBtn).toBeEnabled({ timeout: 15_000 });
      await seleccionarPaginaBtn.click();

      const confirmarBtn = modalCuentas.getByRole("button", { name: /Confirmar selección/i });
      await expect(confirmarBtn).toBeEnabled();
      await confirmarBtn.click();

      await expect(modalCuentas).not.toBeVisible();
    });

    await test.step("Set all payment amounts to 0.01", async () => {
      const accountRows = page.locator(".multi-account-row");
      await expect(accountRows.first()).toBeVisible({ timeout: 10_000 });
      
      const rowCount = await accountRows.count();
      for (let i = 0; i < rowCount; i++) {
        const amountInput = accountRows.nth(i).locator("input").first();
        await amountInput.click();
        await amountInput.click();
        await amountInput.press("End");
        await amountInput.fill("0.01");
        await amountInput.press("Tab");
      }
    });

    await test.step("Add description to the payment", async () => {
      const descriptionInput = page.getByRole("textbox", { name: /Agrega una Descripción al/i });
      await expect(descriptionInput).toBeVisible();
      await descriptionInput.click();
      await descriptionInput.fill("test");
      await descriptionInput.press("Tab");
    });

    await test.step("Select EFECTIVO as payment method", async () => {
      const efectivoCard = page.locator(".multi-method-card").filter({ hasText: /^EFECTIVO$/i }).first();
      await expect(efectivoCard).toBeVisible();
      await efectivoCard.click();
    });

    await test.step("Submit payment and verify success", async () => {
      const pagarBtn = page.getByRole("button", { name: /^Pagar$/i, exact: true });
      await expect(pagarBtn).toBeEnabled();

      await Promise.all([
        page.waitForResponse(res => 
          res.url().includes('/api/v1/accounting/payments/pay-multiple-receivable-accounts') && 
          res.request().method() === 'POST' && 
          res.status() === 200
        ),
        pagarBtn.click()
      ]);

      const successMessage = page.locator(".v-snackbar").filter({ hasText: /Abonos creados correctamente/i }).first();
      await expect(successMessage).toBeVisible();
    });

    await test.step("Navigate to the account details of the first item", async () => {
      const firstRow = page.locator(".v-data-table__tr").first();
      await expect(firstRow).toBeVisible({ timeout: 15_000 });

      const actionsCell = firstRow.locator("td").last();
      const threeDotsBtn = actionsCell.locator("button").last();
      await threeDotsBtn.click();
      await page.waitForTimeout(500);

      await clickTableRowAction(page, actionsCell, "Ver esta cuenta");
    });

    await test.step("Attempt to delete the last payment and verify validation error", async () => {
      await expect(page.getByText(/Abonos de la cuenta/i).first()).toBeVisible({ timeout: 15_000 });

      const deletePaymentBtn = page.locator("tbody tr").last().locator("button.text-red, button.tw-text-red-500").last();
      await expect(deletePaymentBtn).toBeVisible();
      await deletePaymentBtn.click();

      const modal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
      await expect(modal).toBeVisible();

      const reasonInput = modal.getByRole("textbox", { name: /Motivo de eliminación/i });
      await reasonInput.click();
      await reasonInput.fill("test");

      const confirmDeleteBtn = modal.getByRole("button", { name: /Eliminar Abono/i });
      await confirmDeleteBtn.click();

      const errorContainer = modal.locator(".tw-bg-lighterror").first();
      await expect(errorContainer).toBeVisible({ timeout: 10_000 });

      const specificErrorMessage = modal.getByText(/No es posible anular este|Anula desde el detalle/i).first();
      await expect(specificErrorMessage).toBeVisible();
    });

    await test.step("Navigate to the payment settlement details", async () => {
      const modal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
      const irAlDetalleBtn = modal.getByRole("button", { name: /Ir al detalle/i });
      await expect(irAlDetalleBtn).toBeVisible();
      await irAlDetalleBtn.click();
    });

    await test.step("Generate and view payment settlement PDF", async () => {
      const generatePdfBtn = page.getByRole("button", { name: /Generar PDF/i }).first();
      await expect(generatePdfBtn).toBeVisible({ timeout: 15_000 });
      
      await Promise.all([
        page.waitForResponse(res => 
          res.url().includes('/voucher-payment-account-detail') && 
          res.request().method() === 'POST' && 
          res.status() === 200
        ),
        generatePdfBtn.click()
      ]);

      const pdfViewerModal = page.locator(".v-overlay__content").filter({ has: page.locator(".pdf-viewer-card") }).first();
      await expect(pdfViewerModal).toBeVisible({ timeout: 15_000 });
      await expect(pdfViewerModal.getByText(/Visor de PDF/i)).toBeVisible();

      const closePdfBtn = pdfViewerModal.getByRole("button", { name: /^Cerrar$/i });
      await closePdfBtn.click();
      await expect(pdfViewerModal).not.toBeVisible();
    });

    await test.step("Initiate deletion from the settlement page", async () => {
      const deleteSettlementBtn = page.getByRole("button", { name: /Eliminar Abono/i }).first();
      await expect(deleteSettlementBtn).toBeVisible();
      await deleteSettlementBtn.click();
    });

    await test.step("Fill deletion reason and confirm deletion", async () => {
      const deleteModal = page.locator(".v-overlay__content").filter({ hasText: /Eliminar Abono/i }).first();
      await expect(deleteModal).toBeVisible();

      const reasonInput = deleteModal.getByRole("textbox", { name: /Motivo de eliminación/i });
      await reasonInput.click();
      await reasonInput.fill("test deletion reason");

      const confirmDeleteBtn = deleteModal.getByRole("button", { name: /Eliminar Abono/i });
      
      await Promise.all([
        page.waitForResponse(res => 
          res.url().includes('/api/v1/accounting/account-payment-settlements/') && 
          res.url().includes('/delete') && 
          res.request().method() === 'POST' && 
          res.status() === 200
        ),
        confirmDeleteBtn.click()
      ]);

      const successMessage = page.locator(".v-snackbar").filter({ hasText: /Abono eliminado exitosamente/i }).first();
      await expect(successMessage).toBeVisible();
    });
  });
});