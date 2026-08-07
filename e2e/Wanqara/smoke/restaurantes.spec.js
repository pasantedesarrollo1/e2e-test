import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertPageTitle, assertTextContains } from "./harness/smoke-assertions.js";

test.describe("Smoke — Admin Restaurantes", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/admin/orders/list",                  assert: (p) => assertPageTitle(p, "Ordenes") },
    { path: "/admin/orders-reconciliations/list",  assert: (p) => assertPageTitle(p, "Ordenes por Regularizar") },
    { path: "/admin/tables/management",            assert: (p) => assertTextContains(p, "Áreas") },
  ]);
});