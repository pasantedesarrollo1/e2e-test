 
import { test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { assertProductCardsVisible } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-assertions.js";
import { generateSmokeTests, type SmokeRoute } from "@/e2e/Wanqara/smoke/route-health/harness/smoke-nav.js";

test.describe("Smoke — POS Home", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests(test, [
    { path: "/pos/home", assert: (p) => assertProductCardsVisible(p) },
  ] as SmokeRoute[]);
});
