import { test } from "@playwright/test";
import { requirePosCredentials } from "../../harness/config/settings.js";
import { getSessionPath } from "../../harness/helpers/auth/auth.js";
import { assertProductCardsVisible, assertTextContains } from "./harness/smoke-assertions.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";

test.describe("Smoke - POS Restaurantes", { tag: "@smoke" }, () => {
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath('actor1') });


  generateSmokeTests([
    { path: "/pos/restaurant-home",        assert: (p) => assertProductCardsVisible(p) },
    { path: "/pos/close-restaurant-order", assert: (p) => assertTextContains(p, "Cerrar Orden") },
    { path: "/pos/change-order-status",    assert: (p) => assertTextContains(p, "Cambiar Estado de Orden") },
  ], "actor1");
});
