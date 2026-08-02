import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPath } from "./urls.js";
import { playwrightHarness } from "./settings.js";
import { SEED } from "./seed.js";
import {
  instrumentAuth,
  logActiveToken,
  readActiveToken,
  tokenTail,
} from "./auth-debug.js";

/** The shared session auth.setup.js writes and every spec restores. */
export const SESSION_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.auth/session.json",
);

export async function loginWithEmailPassword(page, { email, password }) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /Iniciar/i }).click();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export async function loginAndSelectSubsidiary(page, { tenantBaseUrl, login, subsidiaryName }) {
  instrumentAuth(page);
  await page.goto(withPath(tenantBaseUrl, "/login"));
  await loginWithEmailPassword(page, login);

  try {
    await page.waitForURL(/\/select-subsidiary(\/|$)/, { timeout: 5000 });
  } catch {
    return;
  }
  try {
    await page.waitForURL((url) => !/\/select-subsidiary(\/|$)/.test(url.pathname), { timeout: 3000 });
    return;
  } catch {
  }

  const listContainer = page.locator("div.tw-space-y-3.tw-mb-8.tw-max-h-64.tw-overflow-y-auto");
  const targetCard = subsidiaryName
    ? listContainer.locator(".v-card").filter({ hasText: subsidiaryName }).first()
    : listContainer.locator(".v-card").first();

  await targetCard.click();

  const continueButton = page.getByRole("button", { name: /Continuar/i }).first();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page).not.toHaveURL(/\/select-subsidiary(\/|$)/);
}

export async function logoutFromSession(page, { tenantBaseUrl } = {}) {
  if (tenantBaseUrl) {
    await page.goto(withPath(tenantBaseUrl, "/admin/home"));
    await expect(page).not.toHaveURL(/\/login(\/|$)/);
  }

  const profileMenu = page.locator(".tw-text-sm.tw-font-semibold").first();
  await profileMenu.click();

  const logoutButton = page.getByRole("button", { name: "Cerrar Sesión", exact: true });
  await logoutButton.click();

  await expect(page).toHaveURL(/\/login(\/|$)/);
}

export async function logoutAndLoginAgain(page, { tenantBaseUrl, login, subsidiaryName }) {
  await logoutFromSession(page, { tenantBaseUrl });
  await loginAndSelectSubsidiary(page, { tenantBaseUrl, login, subsidiaryName });
}

const LOGIN_URL_PATTERN = /\/login(\/|$)/;

const isOnLogin = (page) => LOGIN_URL_PATTERN.test(new URL(page.url()).pathname);

/**
 * Runs `body` while watching for a redirect back to /login.
 *
 * `page.goto` resolves on the `load` event, but the route guard
 * (src/guards/hasPermissions.ts) and the 401 interceptor (src/api/axios.ts)
 * both redirect *after* that, driven by an API response. So a session that the
 * backend has stopped accepting is invisible to a URL check taken right after
 * navigation: the test goes on to wait for markup that can never render and
 * burns its whole budget (up to 120s in CI, times two retries) before failing
 * with a misleading "element not found".
 *
 * Racing the assertion against the redirect keeps the passing path free — the
 * watchdog just loses — while a dead session fails in about a second with the
 * actual reason.
 */
export async function withSessionWatchdog(page, body) {
  const redirectedToLogin = (async () => {
    try {
      await page.waitForURL(LOGIN_URL_PATTERN);
    } catch {
      // Either `body` finished first and the page closed, or the wait timed
      // out. Never settle, so the watchdog cannot win the race.
      return new Promise(() => {});
    }

    // This attempt is already lost. Don't sign in here — that would navigate a
    // page `body` is still racing on. Flag it instead, and let the next
    // ensureAuthenticated repair the session before the retry navigates.
    markSharedSessionSuspect();

    throw new Error(
      `Session lost: the app redirected to ${page.url()} during the test. ` +
        `The stored session was rejected, so no page content will render. ` +
        `The retry re-mints it in ensureAuthenticated; a test that fails on ` +
        `every attempt is a real failure. See the 401 handler in src/api/axios.ts.`,
    );
  })();

  return Promise.race([body(), redirectedToLogin]);
}

/*
 * Re-minting churns the account's one live token. If the session keeps dying
 * something else is competing for the account, and more logins just trade the
 * token back and forth — so cap the repairs and report instead.
 */
const MAX_SESSION_REPAIRS = 3;
let sessionRepairs = 0;

/*
 * Marker dropped by withSessionWatchdog when it catches the app bouncing to
 * /login, read by the next ensureAuthenticated.
 *
 * A revoked token still *exists* in localStorage — the backend rejects it, but
 * the app only clears it once the 401 comes back. So the URL check right after
 * `goto` looks clean even on a retry, and without this the retry would
 * rediscover the dead session the slow way and fail again.
 *
 * It is a file rather than a module variable because Playwright starts a fresh
 * worker process after a failure, which is exactly when this has to survive.
 */
const SUSPECT_PATH = path.join(path.dirname(SESSION_PATH), "session-suspect");

const markSharedSessionSuspect = () => {
  try {
    fs.mkdirSync(path.dirname(SUSPECT_PATH), { recursive: true });
    fs.writeFileSync(SUSPECT_PATH, new Date().toISOString());
  } catch {
    // Best effort: losing the marker only costs one more failed attempt.
  }
};

const isSharedSessionSuspect = () => fs.existsSync(SUSPECT_PATH);

/** Called by auth.setup.js once it has minted a fresh shared session. */
export const clearSharedSessionSuspect = () => {
  try {
    fs.rmSync(SUSPECT_PATH, { force: true });
  } catch {
    // Ignore — a stale marker only costs one redundant re-login.
  }
};

const annotate = (type, description) => {
  try {
    test.info().annotations.push({ type, description });
  } catch {
    // Called outside a test (e.g. a setup helper) — nothing to annotate.
  }
};

/**
 * Signs in again and writes the result back to the shared session file.
 *
 * Safe precisely because it only runs once the shared session is already dead:
 * the token in SESSION_PATH has been revoked, so re-minting loses nothing and
 * every later test picks the working one up from storageState. The old bug was
 * re-logging in *without* the write-back, which left every later test holding
 * a revoked token.
 */
async function repairSharedSession(page, { tenantBaseUrl }) {
  if (sessionRepairs >= MAX_SESSION_REPAIRS) return false;
  sessionRepairs += 1;

  await loginAndSelectSubsidiary(page, {
    tenantBaseUrl,
    login: playwrightHarness.login,
    subsidiaryName: SEED.subsidiary.name,
  });
  await page.context().storageState({ path: SESSION_PATH });

  return true;
}

/**
 * Navigates to `targetPath` using the session minted once by auth.setup.js.
 *
 * A revoked shared session is treated as flaky, not as a failure: it means
 * something else signed in with the same account (a concurrent CI job, a stray
 * login, someone in a browser), which says nothing about the route under test.
 * So it repairs the session in place, re-navigates, and carries on. If the
 * attempt still fails, Playwright's retry starts from the repaired session.
 *
 * Specs that sign in deliberately live in e2e/regression/zz-relogin/, which
 * sorts last so it runs once no shared-session spec is left to poison.
 *
 * Set PLAYWRIGHT_AUTH_DEBUG=1 to trace which token each page carries, who
 * minted a new one, and which request got the first 401.
 */
export async function ensureAuthenticated(page, { tenantBaseUrl, targetPath }) {
  instrumentAuth(page);
  const url = withPath(tenantBaseUrl, targetPath);

  // A previous attempt saw the app bounce to /login, so the token this context
  // just restored is known-dead. Replace it before navigating.
  if (isSharedSessionSuspect()) {
    await recoverSharedSession(page, { tenantBaseUrl, reason: "a previous attempt" });
  }

  await page.goto(url);
  await logActiveToken(page, `on ${targetPath}`);

  // The app cleared the token and redirected before `goto` even resolved.
  if (isOnLogin(page)) {
    await recoverSharedSession(page, { tenantBaseUrl, reason: targetPath });
    await page.goto(url);

    if (isOnLogin(page)) {
      throw new Error(
        `Re-login did not restore the session: ${targetPath} still redirects to ` +
          `${page.url()}. Credentials or the tenant may be wrong.`,
      );
    }
  }
}

async function recoverSharedSession(page, { tenantBaseUrl, reason }) {
  const staleToken = tokenTail(await readActiveToken(page));

  if (!(await repairSharedSession(page, { tenantBaseUrl }))) {
    throw new Error(
      `Shared session died ${MAX_SESSION_REPAIRS} times in this run (last token ` +
        `${staleToken}). Something keeps signing in with the same account — a ` +
        `concurrent CI job, or a stray login. Re-run with ` +
        `PLAYWRIGHT_AUTH_DEBUG=1 to see who mints the replacements.`,
    );
  }

  clearSharedSessionSuspect();

  annotate(
    "session-repaired",
    `${reason} found the shared session revoked (token ${staleToken}); signed ` +
      `in again and rewrote the shared session ` +
      `(repair ${sessionRepairs}/${MAX_SESSION_REPAIRS}).`,
  );
}

export async function ensureTenantLanding(page, { publicBaseUrl, tenantRuc }) {
  const { buildTenantBaseUrl } = await import("./urls.js");
  const tenantBaseUrl = buildTenantBaseUrl(publicBaseUrl, tenantRuc);
  const expectedTenantHost = new URL(tenantBaseUrl).hostname;

  await page.goto(`${publicBaseUrl}/`);

  if (new URL(page.url()).hostname !== expectedTenantHost) {
    await page.getByPlaceholder("ejemplo").fill(tenantRuc);
    await page.getByRole("button", { name: /^Ingresar$/i }).click();
    await expect(page).toHaveURL(new RegExp(expectedTenantHost));
  }

  return { tenantBaseUrl, expectedTenantHost };
}