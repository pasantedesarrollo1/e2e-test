import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextContains, assertMainContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Admin Ajustes", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/settings/general",       assert: (p) => assertTextContains(p, "Configuraciones de Empresa") },
    { path: "/admin/settings/franchise",     assert: (p) => assertTextContains(p, "Franquicia") },
    { path: "/admin/settings/signature",     assert: (p) => assertTextContains(p, "Configuraciones de Firma Electrónica") },
    { path: "/admin/settings/banner",        assert: (p) => assertTextContains(p, "Gestión de Banners") },
    { path: "/admin/settings/printers",      assert: (p) => assertTextContains(p, "Configuraciones de Impresoras") },
    { path: "/admin/settings/notifications", assert: (p) => assertTextContains(p, "Notificaciones") },
    { path: "/admin/settings/forms",         assert: (p) => assertTextContains(p, "Formularios") },
    { path: "/admin/settings/subscriptions", assert: (p) => assertTextContains(p, "Suscripciones") },
    { path: "/admin/account",                assert: (p) => assertTextContains(p, "Perfil de Usuario") },
    { path: "/admin/subsidiaries/list",      assert: (p) => assertPageTitle(p, "Sucursales") },
    { path: "/admin/subsidiaries/add",       assert: (p) => assertTextContains(p, "Agregar una Sucursal") },
    { path: "/admin/warehouses/list",        assert: (p) => assertPageTitle(p, "Bodegas") },
    { path: "/admin/warehouses/add",         assert: (p) => assertTextContains(p, "Creación de Bodega") },
    { path: "/admin/dispatch-types/list",    assert: (p) => assertPageTitle(p, "Tipos de Despacho") },
    { path: "/admin/dispatch-types/add",     assert: (p) => assertTextContains(p, "Agregar tipo de despacho") },
    { path: "/admin/checkouts/list",         assert: (p) => assertPageTitle(p, "Puntos de Emisión") },
    { path: "/admin/checkouts/add",          assert: (p) => assertTextContains(p, "Crear punto de Emisión") },
    { path: "/admin/support/tickets/list",   assert: (p) => assertPageTitle(p, "Mis Tickets") },
    { path: "/admin/support/tickets/create", assert: (p) => assertMainContains(p, "Selecciona una categoría") },
    { path: "/admin/ats",                    assert: (p) => assertTextContains(p, "Generador de ATS") },
    { path: "/admin/ats-list",               assert: (p) => assertPageTitle(p, "Registros de ATS") },
  ]);
});