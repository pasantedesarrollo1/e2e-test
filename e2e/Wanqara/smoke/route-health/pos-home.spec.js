import { test } from "@playwright/test";
import { getTenantBaseUrl, requirePosCredentials } from "../../harness/config/settings.js";
import { assertProductCardsVisible } from "./harness/smoke-assertions.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";

test.describe("Smoke — POS Home", { tag: "@smoke" }, () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  generateSmokeTests(tenantBaseUrl, [
    { path: "/pos/home", assert: (p) => assertProductCardsVisible(p) },
  ]);
});
