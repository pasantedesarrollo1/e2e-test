import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextVisible, assertTextContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Transacciones > Otros Documentos", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/quotes/list",                                    assert: (p) => assertPageTitle(p, "Cotizaciones") },
    { path: "/admin/quotes/add",                                     assert: (p) => assertTextVisible(p, "Agregar Cotización") },
    { path: "/admin/waybills/list",                                  assert: (p) => assertPageTitle(p, "Guías de Remisión") },
    { path: "/admin/waybills/add/internal?creates_transfer=0",      assert: (p) => assertTextContains(p, "Creación de Guía de Remisión Interna") },
    { path: "/admin/waybills/add/external",                         assert: (p) => assertTextContains(p, "Creación de Guía de Remisión Externa") },
    { path: "/admin/cash-registers/list",                            assert: (p) => assertPageTitle(p, "Historial de Cierres de Caja") },
    { path: "/admin/edocuments/list",                                assert: (p) => assertPageTitle(p, "Documentos Electrónicos") },
  ]);
});