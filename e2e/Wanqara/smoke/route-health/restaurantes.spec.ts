 
import { test } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertPageTitle, assertTextContains } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — Admin Restaurantes", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/admin/orders/list",                  assert: (p) => assertPageTitle(p, "Ordenes") },
    { path: "/admin/orders-reconciliations/list",  assert: (p) => assertPageTitle(p, "Ordenes por Regularizar") },
    { path: "/admin/tables/management",            assert: (p) => assertTextContains(p, "Áreas") },
    { path: "/admin/categories/extras/list",            assert: (p) => assertTextContains(p, "Categorías extra") }, //TES-214: Implemented smoke test route 
  ] as SmokeRoute[]);
});
