 
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertPageTitle, assertTextContains, assertTextVisible } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — Transacciones > Compras", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/admin/purchases/list/",                assert: (p) => assertPageTitle(p, "Historial de Compras") },
    { path: "/admin/inventory-purchases/add",        assert: (p) => assertTextVisible(p, "Compras con Movimientos de Inventario") },
    { path: "/admin/no-inventory-purchases/add",     assert: (p) => assertTextVisible(p, "Compras sin Movimientos de Inventario") },
    { path: "/admin/withholdings/",                  assert: (p) => assertPageTitle(p, "Retenciones de Compras") },
    { path: "/admin/credit_notes/list",              assert: (p) => assertPageTitle(p, "Notas de Crédito Compras") },
    { path: "/admin/credit_notes/add",               assert: (p) => assertTextContains(p, "Agregar Nota de Crédito por") },
  ] as SmokeRoute[]);
});
