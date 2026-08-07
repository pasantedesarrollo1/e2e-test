import { expect } from "@playwright/test";
import { SEED } from "../../../harness/seed.js";

export const STANDARD_PRODUCTS = [
  { ...SEED.products.estandar,        searchTerm: null },
  { ...SEED.products.estandarVirtual, searchTerm: null },
  { ...SEED.products.subproducto,     searchTerm: null },
  { ...SEED.products.preElaborado,    searchTerm: null },
  { ...SEED.products.elaborado,       searchTerm: null },
  { ...SEED.products.combo,           searchTerm: null },
  { ...SEED.products.servicio,        searchTerm: null },
  { ...SEED.products.estandar,        searchTerm: SEED.products.estandar.code,        type: "Estandar Fisico-codigo"  },
  { ...SEED.products.estandarVirtual, searchTerm: SEED.products.estandarVirtual.code, type: "Estandar Virtual-codigo" },
  { ...SEED.products.subproducto,     searchTerm: SEED.products.subproducto.code,     type: "Subproducto-codigo"      },
  { ...SEED.products.preElaborado,    searchTerm: SEED.products.preElaborado.code,    type: "Pre-Elaborado-codigo"    },
  { ...SEED.products.elaborado,       searchTerm: SEED.products.elaborado.code,       type: "Elaborado-codigo"        },
  { ...SEED.products.combo,           searchTerm: SEED.products.combo.code,           type: "Combo-codigo"            },
  { ...SEED.products.servicio,        searchTerm: SEED.products.servicio.code,        type: "Servicio-codigo"         },
];

export const SERIES_PRODUCTS = [
  { ...SEED.products.serie, searchTerm: null,                 type: "Serie-por-nombre" },
  { ...SEED.products.serie, searchTerm: SEED.products.serie.code,  type: "Serie-por-codigo" },
];

export const TALLA_COLOR_PRODUCTS = [
  { ...SEED.products.tallaColor,         searchTerm: null,                              type: "TallaColor-por-nombre"          },
  { ...SEED.products.tallaColor,         searchTerm: SEED.products.tallaColor.code,          type: "TallaColor-por-codigo-padre"    },
  { ...SEED.products.tallaColorVariante, searchTerm: SEED.products.tallaColorVariante.code,  type: "TallaColor-por-codigo-variante" },
];

export const ALL_PRODUCTS = [
  ...STANDARD_PRODUCTS,
  ...SERIES_PRODUCTS,
];

export async function selectFirstVariant(page) {
  const tallaColorModal = page.locator(".v-overlay__content").filter({
    hasText: /Variantes encontradas/i,
  }).first();
  await expect(tallaColorModal).toBeVisible();

  const firstAgregarButton = tallaColorModal.getByRole("button", { name: /Agregar/i }).first();
  await firstAgregarButton.click();

  const agregarSeleccionButton = tallaColorModal.getByRole("button", { name: /Agregar Selección/i });
  await agregarSeleccionButton.click();

  await expect(tallaColorModal).not.toBeVisible();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function selectFirstSerie(page) {
  const seriesModal = page.locator(".v-overlay__content").filter({
    has: page.locator(".tw-font-mono.tw-text-sm"),
  }).first();
  await expect(seriesModal).toBeVisible({ timeout: 30000 });

  const firstSerie = seriesModal.locator(".tw-font-mono.tw-text-sm").first();
  await firstSerie.click();

  const saveButton = seriesModal.getByRole("button", { name: /Guardar/i });
  await saveButton.click();

  await expect(seriesModal).not.toBeVisible();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}