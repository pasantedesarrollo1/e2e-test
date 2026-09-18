import type { Page } from "@playwright/test";
import { selectFirstSerie, selectFirstVariant } from "@/e2e/Wanqara/regression/POS/harness/products/pos-products.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/transactions/sales/harness/admin-checkout-helpers.js";

export interface MixedCartOptions {
  estandarName: string;
  serieName: string;
  tallaColorName: string;
}

export async function buildMixedCart(page: Page, { estandarName, serieName, tallaColorName }: MixedCartOptions, dispatchEnabled = false): Promise<void> {
  await searchAndSelectProduct(page, { name: estandarName });

  await searchAndSelectProduct(page, { name: serieName });
  if (!dispatchEnabled) {
    await selectFirstSerie(page);
  }

  await searchAndSelectProduct(page, { name: tallaColorName });
  await selectFirstVariant(page);
}

export async function buildPreSaleMixedCart(page: Page, { estandarName, serieName, tallaColorName }: MixedCartOptions): Promise<void> {
  await searchAndSelectProduct(page, { name: estandarName });
  await searchAndSelectProduct(page, { name: serieName });
  await searchAndSelectProduct(page, { name: tallaColorName });
  await selectFirstVariant(page);
}
