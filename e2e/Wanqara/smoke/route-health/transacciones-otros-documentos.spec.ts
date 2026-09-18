 
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertPageTitle, assertTextContains, assertTextVisible } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — Transacciones > Otros Documentos", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/admin/quotes/list",                                    assert: (p) => assertPageTitle(p, "Cotizaciones") },
    { path: "/admin/quotes/add",                                     assert: (p) => assertTextVisible(p, "Agregar Cotización") },
    { path: "/admin/waybills/list",                                  assert: (p) => assertPageTitle(p, "Guías de Remisión") },
    { path: "/admin/waybills/add/internal?creates_transfer=0",      assert: (p) => assertTextContains(p, "Creación de Guía de Remisión Interna") },
    { path: "/admin/waybills/add/external",                         assert: (p) => assertTextContains(p, "Creación de Guía de Remisión Externa") },
    { path: "/admin/cash-registers/list",                            assert: (p) => assertPageTitle(p, "Historial de Cierres de Caja") },
    { path: "/admin/edocuments/list",                                assert: (p) => assertPageTitle(p, "Documentos Electrónicos") },
  ] as SmokeRoute[]);
});
