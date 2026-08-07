import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertAdminHomeWelcome, assertTextVisible } from "./harness/smoke-assertions.js";

test.describe("Smoke — Admin Principal", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/home",                                                                      assert: assertAdminHomeWelcome },
    { path: "/admin/reports/create",                                                            assert: (p) => assertTextVisible(p, "Generación de Reportes") },
    { path: "/admin/reports/create?reportId=reporte-de-ventas",                                assert: (p) => assertTextVisible(p, "Reportes de Ventas") },
    { path: "/admin/reports/create?reportId=reporte-de-ventas-por-producto",                   assert: (p) => assertTextVisible(p, "Reportes de Ventas por Producto") },
    { path: "/admin/reports/create?reportId=reporte-de-ventas-por-producto-de-tipo-combo",     assert: (p) => assertTextVisible(p, "Reportes de Ventas por Producto de tipo Combo") },
    { path: "/admin/reports/create?reportId=reporte-detallado-de-ventas-por-producto",         assert: (p) => assertTextVisible(p, "Reporte Detallado de Ventas por Producto") },
    { path: "/admin/reports/create?reportId=reporte-de-ventas-por-metodo-de-pago",             assert: (p) => assertTextVisible(p, "Reportes de Ventas por Método de Pago") },
    { path: "/admin/reports/create?reportId=reporte-de-cotizaciones",                          assert: (p) => assertTextVisible(p, "Reportes de Cotizaciones") },
    { path: "/admin/reports/create?reportId=reporte-de-inventarios",                           assert: (p) => assertTextVisible(p, "Reporte General de Inventarios") },
    { path: "/admin/reports/create?reportId=reporte-de-inventarios-serie",                     assert: (p) => assertTextVisible(p, "Reportes de Inventarios de Producto Serie") },
    { path: "/admin/reports/create?reportId=reporte-tributario",                               assert: (p) => assertTextVisible(p, "Reporte Tributario") },
    { path: "/admin/reports/create?reportId=reporte-de-cuentas-por-cobrar",                    assert: (p) => assertTextVisible(p, "Reporte de Cuentas Por Cobrar") },
    { path: "/admin/reports/create?reportId=reporte-de-cuentas-por-pagar",                     assert: (p) => assertTextVisible(p, "Reporte de Cuentas Por Pagar") },
    { path: "/admin/reports/create?reportId=reporte-de-cierres-de-caja",                       assert: (p) => assertTextVisible(p, "Reporte de Cierres de Caja") },
  ]);
});