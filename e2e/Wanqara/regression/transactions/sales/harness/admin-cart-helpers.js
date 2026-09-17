import { selectFirstSerie, selectFirstVariant } from "../../../POS/harness/products/pos-products.js";
import { searchAndSelectProduct } from "./admin-checkout-helpers.js";

export async function buildMixedCart(page, { estandarName, serieName, tallaColorName }, dispatchEnabled = false) {
  await searchAndSelectProduct(page, { name: estandarName });

  await searchAndSelectProduct(page, { name: serieName });
  if (!dispatchEnabled) {
    await selectFirstSerie(page);
  }

  await searchAndSelectProduct(page, { name: tallaColorName });
  await selectFirstVariant(page);
}

export async function buildPreSaleMixedCart(page, { estandarName, serieName, tallaColorName }) {
  await searchAndSelectProduct(page, { name: estandarName });
  await searchAndSelectProduct(page, { name: serieName });
  await searchAndSelectProduct(page, { name: tallaColorName });
  await selectFirstVariant(page);
}
