import { SEED } from "../../../../harness/config/seed.js";
import { searchAndSelectProduct } from "./admin-sale-flow.js";
import { selectFirstVariant, selectFirstSerie } from "../../../POS/harness/pos-products.js";

export async function buildMixedCart(page, dispatchEnabled = false) {
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });

  await searchAndSelectProduct(page, { name: SEED.products.serie.name });
  if (!dispatchEnabled) {
    await selectFirstSerie(page);
  }

  await searchAndSelectProduct(page, { name: SEED.products.tallaColor.name });
  await selectFirstVariant(page);
}

export async function buildPreSaleMixedCart(page) {
  // En preventas (pre-sales) no se requiere seleccionar la serie, independientemente de si hay despacho o no
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
  await searchAndSelectProduct(page, { name: SEED.products.serie.name });
  await searchAndSelectProduct(page, { name: SEED.products.tallaColor.name });
  await selectFirstVariant(page);
}
