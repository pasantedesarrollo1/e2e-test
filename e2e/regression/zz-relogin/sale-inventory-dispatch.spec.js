/**
 * Lives in `zz-relogin/` so it sorts last: Playwright runs spec files in path
 * order, and this is the only spec allowed to sign in. Signing in revokes the
 * shared token every other spec holds (the backend keeps one live token per
 * user), so it has to run once nothing else is left. Do not rename the
 * directory to something that sorts earlier.
 */
import { test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  playwrightHarness,
  requirePosCredentials,
  getTenantBaseUrl,
  hasTenantData,
  hasLoginCredentials,
} from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import {
  loginAndSelectSubsidiary,
  logoutAndLoginAgain,
} from "../../harness/auth.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";
import { setDispatchInventory } from "../harness/subsidiary-dispatch.js";
import {
  selectFirstVariant,
  selectFirstSerie,
} from "../harness/pos-products.js";

const SESSION_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.auth/session.json",
);

function buildProbeProducts({ dispatchEnabled }) {
  return [
    {
      ...SEED.products.estandar,
      searchTerm: null,
      afterProductSelect: null,
    },
    {
      ...SEED.products.serie,
      searchTerm: null,
      type: "Serie-por-nombre",
      afterProductSelect: dispatchEnabled ? null : selectFirstSerie,
    },
    {
      ...SEED.products.tallaColor,
      searchTerm: null,
      type: "TallaColor-por-nombre",
      afterProductSelect: selectFirstVariant,
    },
  ];
}

async function runSaleScenario(page, { tenantBaseUrl, dispatchEnabled }) {
  const products = buildProbeProducts({ dispatchEnabled });

  await test.step(`setup: ${dispatchEnabled ? "Enable" : "Disable"} post-sale inventory dispatch`, async () => {
    await loginAndSelectSubsidiary(page, {
      tenantBaseUrl,
      login: playwrightHarness.login,
      subsidiaryName: SEED.subsidiary.name,
    });

    await setDispatchInventory(page, { tenantBaseUrl, enable: dispatchEnabled });

    await logoutAndLoginAgain(page, {
      tenantBaseUrl,
      login: playwrightHarness.login,
      subsidiaryName: SEED.subsidiary.name,
    });
  });

  for (const { name, type, searchTerm, afterProductSelect } of products) {
    await test.step(`Sale [${type}] — ${name}`, async () => {
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: name,
        searchTerm,
        afterProductSelect,
      });
    });
  }
}

test.describe("POS Retail — Sales with and without Post-Sale Inventory Dispatch @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: { cookies: [], origins: [] } });

  test("completes sales with post-sale inventory dispatch enabled without re-login between transactions", async ({ page }) => {
    test.setTimeout(180_000);
    await runSaleScenario(page, {
      tenantBaseUrl: getTenantBaseUrl(),
      dispatchEnabled: true,
    });
  });

  test("completes sales with post-sale inventory dispatch disabled without re-login between transactions", async ({ page }) => {
    test.setTimeout(180_000);
    await runSaleScenario(page, {
      tenantBaseUrl: getTenantBaseUrl(),
      dispatchEnabled: false,
    });
  });

  /**
   * These tests sign in for themselves, which revokes the token held in the
   * shared storageState — the backend keeps one live token per user. This file
   * sorts early among the regression specs, so the ~8 spec files that follow
   * depend on this hook putting a working token back in session.json.
   *
   * That makes it load-bearing, so it retries rather than giving up on the
   * first flake. It still never throws: a failure here would be reported
   * against this file, while the real damage shows up later. The specs that
   * follow fail with ensureAuthenticated's "shared session is not valid"
   * message, which points at the actual cause.
   */
  test.afterAll(async ({ browser }) => {
    if (!hasTenantData() || !hasLoginCredentials()) return;

    const ATTEMPTS = 3;

    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      let context;
      try {
        context = await browser.newContext({ storageState: { cookies: [], origins: [] } });

        await loginAndSelectSubsidiary(await context.newPage(), {
          tenantBaseUrl: getTenantBaseUrl(),
          login: playwrightHarness.login,
          subsidiaryName: SEED.subsidiary.name,
        });

        await context.storageState({ path: SESSION_PATH });
        return;
      } catch (error) {
        console.error(
          `[sale-inventory-dispatch] Re-minting the shared session failed ` +
            `(attempt ${attempt}/${ATTEMPTS}): ${error.message}`,
        );
      } finally {
        await context?.close().catch(() => undefined);
      }
    }

    console.error(
      `[sale-inventory-dispatch] Gave up re-minting ${SESSION_PATH}. Every ` +
        `shared-session spec after this file will see a revoked token.`,
    );
  });
});