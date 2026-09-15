import { test } from "@playwright/test";
import { requirePosCredentials } from "../../harness/config/settings.js";
import { assertProductCardsVisible } from "./harness/smoke-assertions.js";
import { generateSmokeTests } from "./harness/smoke-nav.js";

test.describe("Smoke — POS Home", { tag: "@smoke" }, () => {
  requirePosCredentials(test);


  generateSmokeTests([
    { path: "/pos/home", assert: (p) => assertProductCardsVisible(p) },
  ]);
});
