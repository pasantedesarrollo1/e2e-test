import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";
import { assertProductCardsVisible } from "./harness/smoke-assertions.js";

test.describe("Smoke — POS Home", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/pos/home", assert: (p) => assertProductCardsVisible(p) },
  ]);
});