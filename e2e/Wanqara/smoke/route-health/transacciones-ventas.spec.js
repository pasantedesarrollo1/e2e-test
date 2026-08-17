import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextVisible } from "./harness/smoke-assertions.js";

test.describe("Smoke — Transacciones > Ventas", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/sales/list?per_page=10",   assert: (p) => assertPageTitle(p, "Historial de Ventas") },
    { path: "/admin/ventas/add",               assert: (p) => assertTextVisible(p, "Datos de Venta") },
    { path: "/admin/pre-sale/add",             assert: (p) => assertTextVisible(p, "Agregar Preventa") },
    { path: "/admin/sales-withholdings/",      assert: (p) => assertPageTitle(p, "Retenciones de Ventas") },
    { path: "/admin/withholdings/sales/add",   assert: (p) => assertTextVisible(p, "Crear Retención") },
    { path: "/admin/sale-credit_notes/list",   assert: (p) => assertPageTitle(p, "Notas de Crédito Ventas") },
    { path: "/admin/credit_notes/sales/add",   assert: (p) => assertTextVisible(p, "Notas de Crédito de Venta") },
  ]);
});