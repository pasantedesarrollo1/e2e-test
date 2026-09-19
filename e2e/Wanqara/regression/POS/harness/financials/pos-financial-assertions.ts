import { expect, test, type Page } from "@playwright/test";
import { selectClientByCedula } from '@/e2e/Wanqara/harness/helpers/shared/client-picker.js';
import { completePayment, type PaymentMethodOption } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { captureSaleMutation } from '@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js';

export interface FinancialUIState {
  descuentos?: string;
  subtotal: string;
  impuestos: string;
  total: string;
  propina?: string;
}

export interface FinancialDetailState {
  price?: number;
  [key: string]: unknown;
}

export interface FinancialSummaryState {
  [key: string]: unknown;
}

export interface FinancialPrecisionState {
  ui: FinancialUIState;
  detail?: FinancialDetailState;
  details?: FinancialDetailState[];
  summary: FinancialSummaryState;
}

export interface AssertOptions {
  precision: FinancialPrecisionState;
  multiProduct?: boolean;
  paymentMethod?: string | PaymentMethodOption;
}

export async function finalizeSaleAndAssert(page: Page, { precision, multiProduct = false, paymentMethod }: AssertOptions): Promise<void> {
  const finishBtn = page.getByRole("button", { name: /Terminar Venta/i });

  await finishBtn.click();

  await page.waitForURL(/\/pos\/(restaurant-)?payments/);
  
  await assertPaymentModalUI(page, precision.ui);

  const requestPromise = captureSaleMutation(page);

  await completePayment(page, { paymentMethod });

  const request = await requestPromise;
  const body = request.postDataJSON() as Record<string, unknown>;

  if (multiProduct) {
    assertAllProductsDetailPrecision(body, precision.details || []);
  } else {
    assertDetailPrecision(body, precision.detail || {});
  }
  assertSummaryPrecision(body, precision.summary);
  assertPaymentPayloadPrecision(body, precision);
}

export interface FinancialFlowOptions {
  product: { name: string; searchTerm?: string | null };
  afterProductSelect?: (page: Page) => Promise<void>;
  applyModifier: (page: Page) => Promise<void>;
  precision: FinancialPrecisionState;
  precisionHoliday?: FinancialPrecisionState;
  requiresClient?: string;
  skipAmount?: boolean;
  amountToSet?: number | string;
  paymentMethod?: string | PaymentMethodOption;
}

export async function runFinancialPrecisionFlow(page: Page, {
  product,
  afterProductSelect,
  applyModifier,
  precision,
  precisionHoliday,
  requiresClient,
  skipAmount,
  amountToSet,
  paymentMethod
}: FinancialFlowOptions): Promise<void> {
  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await expect(page.getByText(/No hay productos seleccionados/i)).toBeVisible();

  if (requiresClient) {
    await test.step(`Assign customer [${requiresClient}]`, async () => {
      await selectClientByCedula(page, requiresClient);
    });
  }

  await test.step("Add product", async () => {
    await searchAndSelectProduct(page, { name: product.name, searchTerm: product.searchTerm ?? undefined });
    // Conditional logic is required in helpers for parametric data-driven assertions or state checks.
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (afterProductSelect) await afterProductSelect(page);
  });

  if (skipAmount === false && amountToSet) {
    await test.step(`Set quantity to ${amountToSet}`, async () => {
      const input = page.locator("input[inputmode='decimal']").first();
      await input.fill(String(amountToSet));
      await input.press("Tab");
    });
  }

  await test.step("Apply financial adjustment", async () => {
    await applyModifier(page);
  });

  let activePrecision = precision;
  if (precisionHoliday) {
    const isHoliday = await page.getByText("IVA DIFERENCIADO APLICADO").isVisible();
    if (isHoliday) {
      activePrecision = precisionHoliday;
    }
  }

  await test.step("Verify the sale summary in the UI", async () => {
    await assertSalePanelUI(page, activePrecision.ui);
  });

  await test.step("Complete the sale and validate financial calculations", async () => {
    await finalizeSaleAndAssert(page, { precision: activePrecision, paymentMethod });
  });
}

export interface ModifierRateOptions {
  buttonName: string | RegExp;
  dialogText: string | RegExp;
  confirmLabel: string | RegExp;
  rate: number | string;
}

async function applyRateModifier(page: Page, { buttonName, dialogText, confirmLabel, rate }: ModifierRateOptions): Promise<void> {
  const btn = page.getByRole("button", { name: buttonName }).first();
  await btn.click();

  const dialog = page.locator(".v-overlay__content").filter({ hasText: dialogText }).first();

  const input = dialog.locator("input[type='number']").first();
  await input.fill(String(rate));
  await input.press("Tab");

  const assignBtn = dialog.getByRole("button", { name: confirmLabel });
  await assignBtn.click();

  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function applyGeneralDiscount(page: Page, rate: number | string): Promise<void> {
  if (!rate) throw new Error("applyGeneralDiscount requires rate parameter");
  await applyRateModifier(page, {
    buttonName: /Descuento General/i,
    dialogText:  /Asignar Descuento a la Venta/i,
    confirmLabel: /Asignar descuento/i,
    rate,
  });
}

export async function applyManualSurcharge(page: Page, rate: number | string): Promise<void> {
  if (!rate) throw new Error("applyManualSurcharge requires rate parameter");
  const discountBtn = page.getByRole("button", { name: /Descuento General/i }).first();
  const innerChevron = discountBtn.locator("button").last();
  await innerChevron.click();

  const rechargeItem = page
    .locator(".v-list-item")
    .filter({ hasText: /Aplicar Recargo/i })
    .first();
  await rechargeItem.click();

  const dialog = page
    .locator(".v-overlay__content")
    .filter({ has: page.getByPlaceholder("Ingresa un Recargo") })
    .first();

  const surchargeInput = dialog.getByPlaceholder("Ingresa un Recargo");
  await surchargeInput.fill(String(rate));
  await surchargeInput.press("Tab");

  const assignBtn = dialog.getByRole("button", { name: /Asignar recargo/i });
  await assignBtn.click();

  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function assertSalePanelUI(page: Page, ui: FinancialUIState): Promise<void> {
  const panel = page.locator(".v-card").filter({ hasText: /Precio Total/i }).first();
  const matchCurrency = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
    const [int, dec] = num.toString().split('.');
    const decPattern = dec ? `\\.${dec}0*` : `(\\.0+)?`;
    return new RegExp(`\\$\\s*${int}${decPattern}\\b`);
  };

  const assertRowValue = async (labelRegex: RegExp, currencyString: string, isRed = false) => {
    await expect(panel.locator("span, p, div").filter({ hasText: labelRegex }).last()).toBeVisible();
    
    const valueLocator = panel.locator("span").filter({ hasText: matchCurrency(currencyString) }).last();
    
    await expect(valueLocator).toBeVisible();
    if (isRed) {
      await expect(valueLocator).toHaveClass(/tw-text-red/);
    }
  };

  if (ui.descuentos) {
    await assertRowValue(/Descuentos/i, ui.descuentos, true);
  }

  await assertRowValue(/Subtotal sin Impuestos/i, ui.subtotal);
  await assertRowValue(/Impuestos/i, ui.impuestos);
  await assertRowValue(/Precio Total/i, ui.total);

  if (ui.propina) {
    await assertRowValue(/Propina Adicional/i, ui.propina);

    const totalNum = parseFloat(ui.total.replace(/[^0-9.-]+/g, ""));
    const propinaNum = parseFloat(ui.propina.replace(/[^0-9.-]+/g, ""));
    const grandTotal = (totalNum + propinaNum).toFixed(2);

    await assertRowValue(/^Total$/i, grandTotal);
  }
}

export function assertDetailPrecision(body: Record<string, unknown>, expected: FinancialDetailState): void {
  const details = body.details as Record<string, unknown>[];
  const detail = details[0];
  for (const [key, value] of Object.entries(expected)) {
    expect(detail[key], `detail.${key}`).toBe(value);
  }
}

export function assertAllProductsDetailPrecision(body: Record<string, unknown>, expectedDetails: FinancialDetailState[]): void {
  expectedDetails.forEach((expected) => {
    const details = body.details as Record<string, unknown>[];
    const detail = details.find((d: Record<string, unknown>) => d.price === expected.price);
    expect(detail, `Product with price ${expected.price} was not found`).toBeDefined();
    for (const [key, value] of Object.entries(expected)) {
      expect(detail![key], `detail[price=${expected.price}].${key}`).toBe(value);
    }
  });
}

export function assertSummaryPrecision(body: Record<string, unknown>, expected: FinancialSummaryState): void {
  const summary = body.summary as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    expect(summary[key], `summary.${key}`).toBe(value);
  }
}

export async function assertPaymentModalUI(page: Page, ui: FinancialUIState): Promise<void> {
  const modal = page.locator(".v-card").filter({ hasText: /Venta Total/i }).first();

  const matchCurrency = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
    const [int, dec] = num.toString().split('.');
    const decPattern = dec ? `\\.${dec}0*` : `(\\.0+)?`;
    return new RegExp(`(\\$?\\s*${int}${decPattern}\\s*\\$?)\\b`);
  };

  await expect(modal.locator("span.tw-text-primary").filter({ hasText: /Venta Total/i }).first()).toBeVisible();
  
  const expectedTotal = matchCurrency(ui.total);
  await expect(modal.locator("span.tw-text-primary").filter({ hasText: expectedTotal }).first()).toBeVisible();

  if (ui.propina) {
    await expect(modal.locator("span").filter({ hasText: /Propina Adicional/i }).first()).toBeVisible();
    await expect(modal.locator("span").filter({ hasText: matchCurrency(ui.propina) }).first()).toBeVisible();

    const totalNum = parseFloat(ui.total.replace(/[^0-9.-]+/g, ""));
    const propinaNum = parseFloat(ui.propina.replace(/[^0-9.-]+/g, ""));
    const grandTotal = (totalNum + propinaNum).toFixed(2);
    
    const totalLabel = modal.locator("span.tw-text-primary").filter({ hasText: /^Total$/ }).first();
    await expect(totalLabel).toBeVisible();
    await expect(modal.locator("span.tw-text-primary").filter({ hasText: matchCurrency(grandTotal) }).first()).toBeVisible();
  }
}

export function assertPaymentPayloadPrecision(body: Record<string, unknown>, precision: FinancialPrecisionState): void {
  const totalNum = parseFloat(precision.ui.total.replace(/[^0-9.-]+/g, ""));
  let expectedReceivedPayment = totalNum;

  if (precision.ui.propina) {
    const propinaNum = parseFloat(precision.ui.propina.replace(/[^0-9.-]+/g, ""));
    expectedReceivedPayment += propinaNum;
  }

  const expectedBasePaymentStr = totalNum.toFixed(2);
  const expectedReceivedPaymentStr = expectedReceivedPayment.toFixed(2);

  expect(
    Number(body.received_payment).toFixed(2), 
    "body.received_payment debe coincidir con el total con propina a 2 decimales"
  ).toBe(expectedReceivedPaymentStr);

  const payments = body.payments as Record<string, unknown>[] | undefined;
  if (payments && payments.length > 0) {
    const totalPayments = payments.reduce((acc: number, curr: Record<string, unknown>) => acc + Number(curr.amount), 0);
    expect(
      totalPayments.toFixed(2), 
      "La suma de body.payments[].amount debe coincidir SÓLO con la Venta Total (sin propina) a 2 decimales"
    ).toBe(expectedBasePaymentStr);
  }
}
