import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextVisible, assertTextContains, assertMainContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Inventario > Productos y Servicios", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/products/list",       assert: (p) => assertPageTitle(p, "Gestión de Productos") },
    { path: "/admin/services/list",       assert: (p) => assertPageTitle(p, "Gestión de Servicios") },
    { path: "/admin/productPriceList",    assert: (p) => assertTextContains(p, "Gestión de Precios de productos") },
    { path: "/admin/discounts/list",      assert: (p) => assertPageTitle(p, "Descuentos") },
    { path: "/admin/discounts/add",       assert: (p) => assertTextVisible(p, "Crear Descuento") },
    { path: "/admin/surcharges/list",     assert: (p) => assertPageTitle(p, "Recargos") },
    { path: "/admin/surcharges/add",      assert: (p) => assertTextVisible(p, "Crear recargo") },
    { path: "/admin/categories/list",     assert: (p) => assertMainContains(p, "Categorías") },
    { path: "/admin/categories/add",      assert: (p) => assertTextContains(p, "Crear Categoría") },
    { path: "/admin/brands/list",         assert: (p) => assertPageTitle(p, "Marcas") },
    { path: "/admin/brands/add",          assert: (p) => assertTextContains(p, "Crear Marca") },
    { path: "/admin/sizes/list",          assert: (p) => assertPageTitle(p, "Tallas de Productos") },
    { path: "/admin/sizes/add",           assert: (p) => assertTextVisible(p, "Crear Talla") },
    { path: "/admin/colors/list",         assert: (p) => assertPageTitle(p, "Colores de Productos") },
    { path: "/admin/colors/add",          assert: (p) => assertTextVisible(p, "Crear Color") },
    { path: "/admin/tags",                assert: (p) => assertTextVisible(p, "Listado de Etiquetas") },
    { path: "/admin/tags/create",         assert: (p) => assertTextVisible(p, "Crear Etiqueta") },
  ]);
});