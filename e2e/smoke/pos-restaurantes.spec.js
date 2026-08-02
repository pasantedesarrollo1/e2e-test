import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertTextContains, assertProductCardsVisible } from "./harness/smoke-assertions.js";

test.describe("Smoke — POS Restaurantes", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/pos/restaurant-home",        assert: (p) => assertProductCardsVisible(p) },
    { path: "/pos/close-restaurant-order", assert: (p) => assertTextContains(p, "Cerrar Orden") },
    { path: "/pos/change-order-status",    assert: (p) => assertTextContains(p, "Cambiar Estado de Orden") },
  ]);
});