 
import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { getSessionPath } from "../../harness/helpers/auth/auth.js";
import { assertProductCardsVisible, assertTextContains } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke - POS Restaurantes", { tag: "@smoke" }, () => {
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath('actor1') });


  generateSmokeTests(test, [
    { path: "/pos/restaurant-home",        assert: (p) => assertProductCardsVisible(p) },
    { path: "/pos/close-restaurant-order", assert: (p) => assertTextContains(p, "Cerrar Orden") },
    { path: "/pos/change-order-status",    assert: (p) => assertTextContains(p, "Cambiar Estado de Orden") },
  ] as SmokeRoute[], "actor1");
});
