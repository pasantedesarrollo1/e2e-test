import { test, expect } from "@playwright/test";
import { SEED } from "../../harness/seed.js";
import { selectFirstSerie, selectFirstVariant } from "./pos-products.js";
import { captureSaleMutation, selectClientByCedula } from "./pos-sale-flow.js";
import { searchAndSelectProduct } from "./pos-search.js";
import { completePayment } from "./pos-payment.js";

export const PRECISION_CASES = [
  { key: "estandar", product: SEED.products.estandar, afterProductSelect: null, requiresClient: null,         skipAmount: false },
  { key: "combo",    product: SEED.products.combo,    afterProductSelect: null, requiresClient: "0000000001", skipAmount: false },
];

export async function finalizeSaleAndAssert(page, { precision, multiProduct = false }) {
  const finishBtn = page.getByRole("button", { name: /Terminar Venta/i });

  await finishBtn.click();

  await page.waitForURL(/\/pos\/(restaurant-)?payments/);

  const requestPromise = captureSaleMutation(page);

  await completePayment(page);

  const request = await requestPromise;
  const body = request.postDataJSON();

  if (multiProduct) {
    assertAllProductsDetailPrecision(body, precision.details);
  } else {
    assertDetailPrecision(body, precision.detail);
  }
  assertSummaryPrecision(body, precision.summary);
}

export async function runFinancialPrecisionFlow(page, {
  product,
  afterProductSelect,
  applyModifier,
  precision,
  precisionHoliday,
  requiresClient,
  skipAmount,
  amountToSet
}) {
  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await expect(page.getByText(/No hay productos seleccionados/i)).toBeVisible();

  if (requiresClient) {
    await test.step(`Assign customer [${requiresClient}]`, async () => {
      await selectClientByCedula(page, requiresClient);
    });
  }

  await test.step("Add product", async () => {
    await searchAndSelectProduct(page, { name: product.name, searchTerm: null });
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
    await finalizeSaleAndAssert(page, { precision: activePrecision });
  });
}

async function applyRateModifier(page, { buttonName, dialogText, confirmLabel, rate }) {
  const btn = page.getByRole("button", { name: buttonName }).first();
  await btn.click();

  const dialog = page.locator(".v-overlay__content").filter({ hasText: dialogText }).first();

  const input = dialog.locator("input[type='number']").first();
  await input.fill(String(rate));
  await input.press("Tab");

  const assignBtn = dialog.getByRole("button", { name: confirmLabel });
  await assignBtn.click();

  await expect(dialog).not.toBeVisible();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function applyGeneralDiscount(page, rate = SEED.discount.rate) {
  await applyRateModifier(page, {
    buttonName: /Descuento General/i,
    dialogText:  /Asignar Descuento a la Venta/i,
    confirmLabel: /Asignar descuento/i,
    rate,
  });
}

export async function applyManualSurcharge(page, rate = SEED.surcharge.rate) {
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

  await expect(dialog).not.toBeVisible();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function assertSalePanelUI(page, ui) {
  const panel = page.locator(".v-card").filter({ hasText: /Precio Total/i }).first();
  const matchCurrency = (val) => {
    const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
    const [int, dec] = num.toString().split('.');
    const decPattern = dec ? `\\.${dec}0*` : `(\\.0+)?`;
    return new RegExp(`\\$\\s*${int}${decPattern}\\b`);
  };

  if (ui.descuentos) {
    await expect(panel.locator("span").filter({ hasText: /Descuentos/i }).first()).toBeVisible();
    await expect(panel.locator("span.tw-text-red").filter({ hasText: matchCurrency(ui.descuentos) })).toBeVisible();
  }

  await expect(panel.locator("span").filter({ hasText: matchCurrency(ui.subtotal) }).first()).toBeVisible();
  await expect(panel.locator("span").filter({ hasText: matchCurrency(ui.impuestos) }).first()).toBeVisible();
  await expect(panel.locator("span.tw-text-3xl").filter({ hasText: matchCurrency(ui.total) }).first()).toBeVisible();
}

export function assertDetailPrecision(body, expected) {
  const detail = body.details[0];
  for (const [key, value] of Object.entries(expected)) {
    expect(detail[key], `detail.${key}`).toBe(value);
  }
}

export function assertAllProductsDetailPrecision(body, expectedDetails) {
  expectedDetails.forEach((expected) => {
    const detail = body.details.find(d => d.price === expected.price);
    expect(detail, `Product with price ${expected.price} was not found`).toBeDefined();
    for (const [key, value] of Object.entries(expected)) {
      expect(detail[key], `detail[price=${expected.price}].${key}`).toBe(value);
    }
  });
}

export function assertSummaryPrecision(body, expected) {
  const summary = body.summary;
  for (const [key, value] of Object.entries(expected)) {
    expect(summary[key], `summary.${key}`).toBe(value);
  }
}