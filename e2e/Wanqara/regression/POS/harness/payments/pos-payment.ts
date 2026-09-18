import { expect, type Page, type Locator, type Response } from "@playwright/test";
import { expectSnackbar } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

async function ensureActionButton(page: Page, locator: Locator, shouldBeActive: boolean): Promise<void> {
  await expect(locator).toHaveClass(/summary-action-btn--(active|inactive)/);

  const isActive = await locator.evaluate((el) =>
    el.classList.contains("summary-action-btn--active")
  );

  if (isActive !== shouldBeActive) {
    await locator.click();
  }
}

export interface PaymentMethodOption {
  label: string;
  afterSelect?: (page: Page) => Promise<void>;
}

export interface PaymentOptions {
  paymentMethod?: string | PaymentMethodOption;
  printTicket?: boolean;
  viewPdf?: boolean;
  openDrawer?: boolean;
}

export async function completePayment(page: Page, {
  paymentMethod,
  printTicket = false,
  viewPdf = false,
  openDrawer = false,
}: PaymentOptions = {}): Promise<Response> {
  if (!paymentMethod) throw new Error("completePayment requires a paymentMethod parameter (string or object with label).");

  await expect(page.locator(".summary-action-btn").first()).toBeVisible({ timeout: 10000 });

  const printTicketCard = page.locator(".summary-action-btn").filter({ hasText: /Imprimir/i }).first();
  const viewPdfCard = page.locator(".summary-action-btn").filter({ hasText: /Ver PDF/i }).first();
  const openDrawerCard  = page.locator(".summary-action-btn").filter({ hasText: /Abrir Gaveta/i }).first();

  if (await printTicketCard.isVisible()) await ensureActionButton(page, printTicketCard, printTicket);
  if (await viewPdfCard.isVisible()) await ensureActionButton(page, viewPdfCard, viewPdf);
  if (await openDrawerCard.isVisible()) await ensureActionButton(page, openDrawerCard, openDrawer);

  const label = typeof paymentMethod === 'string' ? paymentMethod : paymentMethod.label;
  const methodOption = page.getByText(label, { exact: true }).first();
  await methodOption.click();

  if (typeof paymentMethod === 'object' && paymentMethod.afterSelect) {
    await paymentMethod.afterSelect(page);
  }

  const finalizarVentaButton = page.getByRole("button", { name: /Finalizar Venta/i });
  
  const [response] = await Promise.all([
    page.waitForResponse(res => 
      res.url().includes('/api/v2/pos/sales') && 
      res.request().method() === 'POST' && 
      res.status() === 200
    ),
    finalizarVentaButton.click({ force: true })
  ]);

  await expectSnackbar(page, /Venta Realizada/i);
  return response;
}
