 
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertPageTitle, assertTextContains } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — Inventario > Garantías y Devoluciones", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/admin/warranty/sales/list",            assert: (p) => assertPageTitle(p, "Garantías de Ventas") },
    { path: "/admin/warranty/sales/add",             assert: (p) => assertTextContains(p, "Registrar Garantía de Ventas") },
    { path: "/admin/warranty/purchases/list",        assert: (p) => assertPageTitle(p, "Garantías de Compras") },
    { path: "/admin/warranty/purchases/add",         assert: (p) => assertTextContains(p, "No hay compra seleccionada") },
    { path: "/admin/sales/returns/list?per_page=10", assert: (p) => assertPageTitle(p, "Devoluciones de Ventas") },
    { path: "/admin/purchases/returns/list",         assert: (p) => assertPageTitle(p, "Devoluciones de Compras") },
  ] as SmokeRoute[]);
});
