import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextVisible, assertTextContains, assertMainContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Finanzas > Cuentas", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/receivables/list",                                                                                    assert: (p) => assertPageTitle(p, "Cuentas por Cobrar") },
    { path: "/admin/payments/list",                                                                                       assert: (p) => assertPageTitle(p, "Cuentas por Pagar") },
    { path: "/admin/payment-drafts/list?filter_status[0]=pending&filter_status[1]=validating",                           assert: (p) => assertPageTitle(p, "Borradores de Pago") },
    { path: "/admin/payment-drafts/add",                                                                                  assert: (p) => assertMainContains(p, "Crear Borrador de Pago") },
    { path: "/admin/payment-drafts/massive-approval",                                                                     assert: (p) => assertTextVisible(p, "Aprobación Masiva de Borradores de Pago") },
    { path: "/admin/authorize-dispatch-sales?filter_delivered=false&filter_can_dispatch=false&filter_is_canceled=false", assert: (p) => assertPageTitle(p, "Aprobar despachos") },
    { path: "/admin/payments/add/receivables",                                                                            assert: (p) => assertTextContains(p, "Registrar un Pago") },
    { path: "/admin/payments/add/paymentAccounts",                                                                        assert: (p) => assertTextContains(p, "Registrar un Pago") },
    { path: "/admin/advances/customer",                                                                                   assert: (p) => assertTextContains(p, "Anticipo de Clientes") },
    { path: "/admin/advances/provider",                                                                                   assert: (p) => assertTextContains(p, "Anticipo a Proveedores") },
  ]);
});