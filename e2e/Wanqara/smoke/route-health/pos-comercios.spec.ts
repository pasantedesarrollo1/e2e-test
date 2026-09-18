 
import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertMainContains, assertTextContains } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — POS Comercios", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/pos/close-cash-register", assert: (p) => assertTextContains(p, "Cierre de Caja") },
    { path: "/pos/saved-sales",         assert: (p) => assertTextContains(p, "Ventas Guardadas") },
    { path: "/pos/account-payments",    assert: (p) => assertTextContains(p, "Pagos de Cuentas por Cobrar") },
    { path: "/pos/cash-register-sales", assert: (p) => assertTextContains(p, "Ventas Realizadas") },
    { path: "/pos/consume-quotes",      assert: (p) => assertMainContains(p, "Recuperar Cotizaciones") },
  ] as SmokeRoute[]);
});
