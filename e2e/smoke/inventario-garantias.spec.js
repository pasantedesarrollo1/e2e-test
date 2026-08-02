import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Inventario > Garantías y Devoluciones", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/warranty/sales/list",            assert: (p) => assertPageTitle(p, "Garantías de Ventas") },
    { path: "/admin/warranty/sales/add",             assert: (p) => assertTextContains(p, "Registrar Garantía de Ventas") },
    { path: "/admin/warranty/purchases/list",        assert: (p) => assertPageTitle(p, "Garantías de Compras") },
    { path: "/admin/warranty/purchases/add",         assert: (p) => assertTextContains(p, "No hay compra seleccionada") },
    { path: "/admin/sales/returns/list?per_page=10", assert: (p) => assertPageTitle(p, "Devoluciones de Ventas") },
    { path: "/admin/purchases/returns/list",         assert: (p) => assertPageTitle(p, "Devoluciones de Compras") },
  ]);
});