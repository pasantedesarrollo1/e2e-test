import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextContains, assertMainContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Inventario > Gestión de Inventario", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/kardex/list",                                                                              assert: (p) => assertPageTitle(p, "Kardex") },
    { path: "/admin/adjustments/list",                                                                         assert: (p) => assertPageTitle(p, "Ajustes de Inventario") },
    { path: "/admin/adjustments/add?name=Manual",                                                             assert: (p) => assertTextContains(p, "Crear un Ajuste") },
    { path: "/admin/adjustments/add-series?name=Serie",                                                       assert: (p) => assertTextContains(p, "Crear un Ajuste de Serie") },
    { path: "/admin/adjustments/add-massive?name=Masivo",                                                     assert: (p) => assertTextContains(p, "Ajustes Masivos") },
    { path: "/admin/transfers/list",                                                                           assert: (p) => assertPageTitle(p, "Transferencias") },
    { path: "/admin/transfers/add/internal?name=Interna",                                                     assert: (p) => assertTextContains(p, "Transferencia Interna") },
    { path: "/admin/transfers/add/external?name=Externa",                                                     assert: (p) => assertMainContains(p, "Transferencia") },
    { path: "/admin/dispatch-sales?filter_delivered=false&filter_can_dispatch=true&filter_is_canceled=false", assert: (p) => assertPageTitle(p, "Despacho Posterior") },
    { path: "/admin/recept-purchases?filter_type=no_inventory",                                               assert: (p) => assertPageTitle(p, "Recepción de Compras") },
    { path: "/admin/premanufactured-inventory",                                                               assert: (p) => assertTextContains(p, "Ajustar Producto Pre Elaborado") },
    { path: "/admin/physical-inventory/list",                                                                 assert: (p) => assertPageTitle(p, "Toma Física de Inventario") },
    { path: "/admin/physical-inventory/add",                                                                  assert: (p) => assertMainContains(p, "Toma Física de Inventario") },
    { path: "/admin/inventory-reset",                                                                         assert: (p) => assertTextContains(p, "Encerado de Inventario de Productos") },
    { path: "/admin/products-bin",                                                                            assert: (p) => assertMainContains(p, "Papelera de Productos") },
  ]);
});