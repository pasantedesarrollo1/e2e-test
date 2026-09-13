import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../harness/config/settings.js";
import { assertMainContains, assertPageTitle, assertTextContains } from "./harness/smoke-assertions.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";

test.describe("Smoke — Admin Personas", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/people/list",       assert: (p) => assertPageTitle(p, "Personas") },
    { path: "/admin/people/add",        assert: (p) => assertTextContains(p, "Nueva Persona") },
    { path: "/admin/rates/list",        assert: (p) => assertPageTitle(p, "Tarifas") },
    { path: "/admin/rates/add",         assert: (p) => assertTextContains(p, "Crear Tarifa") },
    { path: "/admin/users/list",        assert: (p) => assertPageTitle(p, "Usuarios") },
    { path: "/admin/users/add",         assert: (p) => assertTextContains(p, "Nuevo Usuario") },
    { path: "/admin/roles/list",        assert: (p) => assertPageTitle(p, "Roles") },
    { path: "/admin/roles/add",         assert: (p) => assertTextContains(p, "Nuevo Rol") },
    { path: "/admin/apartments/list",   assert: (p) => assertPageTitle(p, "Departamentos") },
    { path: "/admin/apartments/add",    assert: (p) => assertTextContains(p, "Nuevo Departamento") },
    { path: "/admin/users/restore",     assert: (p) => assertMainContains(p, "Papelera de Usuarios") },
  ]);
});
