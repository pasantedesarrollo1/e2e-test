import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextVisible, assertAnyTextVisible } from "./harness/smoke-assertions.js";

test.describe("Smoke — Finanzas > Tesorería", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/treasury/home",         assert: (p) => assertAnyTextVisible(p, ["Abrir Caja de Tesorería", "Pagos de Tesorería"]) },
    { path: "/admin/payment_methods/list",  assert: (p) => assertPageTitle(p, "Métodos de Pago") },
    { path: "/admin/paymentMethods/add",    assert: (p) => assertTextVisible(p, "Agregar Método de Pago") },
    { path: "/admin/financialEntity/list",  assert: (p) => assertPageTitle(p, "Bancos") },
    { path: "/admin/financialEntity/add",   assert: (p) => assertTextVisible(p, "Agregar Banco") },
  ]);
});