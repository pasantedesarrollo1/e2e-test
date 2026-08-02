import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextVisible, assertTextContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Transacciones > Compras", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/purchases/list/",                assert: (p) => assertPageTitle(p, "Historial de Compras") },
    { path: "/admin/inventory-purchases/add",        assert: (p) => assertTextVisible(p, "Compras con Movimientos de Inventario") },
    { path: "/admin/no-inventory-purchases/add",     assert: (p) => assertTextVisible(p, "Compras sin Movimientos de Inventario") },
    { path: "/admin/withholdings/",                  assert: (p) => assertPageTitle(p, "Retenciones de Compras") },
    { path: "/admin/credit_notes/list",              assert: (p) => assertPageTitle(p, "Notas de Crédito Compras") },
    { path: "/admin/credit_notes/add",               assert: (p) => assertTextContains(p, "Agregar Nota de Crédito por") },
  ]);
});