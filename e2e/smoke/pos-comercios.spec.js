import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertTextContains, assertMainContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — POS Comercios", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/pos/close-cash-register", assert: (p) => assertTextContains(p, "Cierre de Caja") },
    { path: "/pos/saved-sales",         assert: (p) => assertTextContains(p, "Ventas Guardadas") },
    { path: "/pos/account-payments",    assert: (p) => assertTextContains(p, "Pagos de Cuentas por Cobrar") },
    { path: "/pos/cash-register-sales", assert: (p) => assertTextContains(p, "Ventas Realizadas") },
    { path: "/pos/consume-quotes",      assert: (p) => assertMainContains(p, "Recuperar Cotizaciones") },
  ]);
});