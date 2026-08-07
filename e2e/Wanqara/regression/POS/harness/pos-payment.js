import { expect } from "@playwright/test";
import { SEED } from "../../../harness/seed.js";

async function ensureActionButton(page, locator, shouldBeActive) {
  await expect(locator).toHaveClass(/summary-action-btn--(active|inactive)/);

  const isActive = await locator.evaluate((el) =>
    el.classList.contains("summary-action-btn--active")
  );

  if (isActive !== shouldBeActive) {
    await locator.click();
  }
}

export async function completePayment(page, {
  paymentMethod = SEED.paymentMethods.efectivo,
  printTicket = false,
  openDrawer = false,
} = {}) {
  const printTicketCard = page.locator(".summary-action-btn").filter({ hasText: /Imprimir Ticket/i }).first();
  const openDrawerCard  = page.locator(".summary-action-btn").filter({ hasText: /Abrir Gaveta/i }).first();

  await ensureActionButton(page, printTicketCard, printTicket);
  await ensureActionButton(page, openDrawerCard, openDrawer);

  const methodOption = page.getByText(paymentMethod.label, { exact: true }).first();
  await methodOption.click();

  if (paymentMethod.afterSelect) {
    await paymentMethod.afterSelect(page);
  }

  const finalizarVentaButton = page.getByRole("button", { name: /Finalizar Venta/i });
  
  await Promise.all([
    page.waitForResponse(res => 
      res.url().includes('/api/v2/pos/sales') && 
      res.request().method() === 'POST' && 
      res.status() === 200
    ),
    finalizarVentaButton.click({ force: true })
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Venta Realizada/i }),
  ).toBeVisible();
}