 
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertAnyTextVisible, assertPageTitle, assertTextVisible } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — Finanzas > Tesorería", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/admin/treasury/home",         assert: (p) => assertAnyTextVisible(p, ["Abrir Caja de Tesorería", "Pagos de Tesorería"]) },
    { path: "/admin/payment_methods/list",  assert: (p) => assertPageTitle(p, "Métodos de Pago") },
    { path: "/admin/paymentMethods/add",    assert: (p) => assertTextVisible(p, "Agregar Método de Pago") },
    { path: "/admin/financialEntity/list",  assert: (p) => assertPageTitle(p, "Bancos") },
    { path: "/admin/financialEntity/add",   assert: (p) => assertTextVisible(p, "Agregar Banco") },
  ] as SmokeRoute[]);
});
