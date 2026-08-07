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

export const getSessionPath = (authType) => path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../.auth/${authType}-session.json`,
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

export async function withSessionWatchdog(page, body, authType = "retail") {
  const redirectedToLogin = (async () => {
    try {
      await page.waitForURL(LOGIN_URL_PATTERN);
    } catch {
      return new Promise(() => {});
    }

    markSharedSessionSuspect(authType);

    throw new Error(
      `Session lost: the app redirected to ${page.url()} during the test. ` +
        `The stored session was rejected, so no page content will render. ` +
        `The retry re-mints it in ensureAuthenticated; a test that fails on ` +
        `every attempt is a real failure. See the 401 handler in src/api/axios.ts.`,
    );
  })();

  return Promise.race([body(), redirectedToLogin]);
}

const MAX_SESSION_REPAIRS = 3;
const sessionRepairs = { retail: 0, dispatch: 0, restaurant: 0 };

const getSuspectPath = (authType) => path.join(path.dirname(getSessionPath(authType)), `${authType}-session-suspect`);

const markSharedSessionSuspect = (authType) => {
  try {
    const suspectPath = getSuspectPath(authType);
    fs.mkdirSync(path.dirname(suspectPath), { recursive: true });
    fs.writeFileSync(suspectPath, new Date().toISOString());
  } catch {
  }
};

const isSharedSessionSuspect = (authType) => fs.existsSync(getSuspectPath(authType));

export const clearSharedSessionSuspect = (authType) => {
  try {
    fs.rmSync(getSuspectPath(authType), { force: true });
  } catch {
    // Ignore — a stale marker only costs one redundant re-login.
  }
};

const annotate = (type, description) => {
  try {
    test.info().annotations.push({ type, description });
  } catch {
  }
};

async function repairSharedSession(page, { tenantBaseUrl, authType }) {
  if (sessionRepairs[authType] >= MAX_SESSION_REPAIRS) return false;
  sessionRepairs[authType] += 1;

  const login = playwrightHarness.users[authType];
  const subsidiaryName = SEED.subsidiaries[authType].name;

  await loginAndSelectSubsidiary(page, {
    tenantBaseUrl,
    login,
    subsidiaryName,
  });
  await page.context().storageState({ path: getSessionPath(authType) });

  return true;
}

export async function ensureAuthenticated(page, { tenantBaseUrl, targetPath, authType = "retail" }) {
  instrumentAuth(page);
  const url = withPath(tenantBaseUrl, targetPath);
  if (isSharedSessionSuspect(authType)) {
    await recoverSharedSession(page, { tenantBaseUrl, reason: "a previous attempt", authType });
  }

  await page.goto(url);
  await logActiveToken(page, `on ${targetPath}`);

  if (isOnLogin(page)) {
    await recoverSharedSession(page, { tenantBaseUrl, reason: targetPath, authType });
    await page.goto(url);

    if (isOnLogin(page)) {
      throw new Error(
        `Re-login did not restore the session: ${targetPath} still redirects to ` +
          `${page.url()}. Credentials or the tenant may be wrong.`,
      );
    }
  }
}

async function recoverSharedSession(page, { tenantBaseUrl, reason, authType }) {
  const staleToken = tokenTail(await readActiveToken(page));

  if (!(await repairSharedSession(page, { tenantBaseUrl, authType }))) {
    throw new Error(
      `Shared session died ${MAX_SESSION_REPAIRS} times in this run (last token ` +
        `${staleToken}). Something keeps signing in with the same account — a ` +
        `concurrent CI job, or a stray login. Re-run with ` +
        `PLAYWRIGHT_AUTH_DEBUG=1 to see who mints the replacements.`,
    );
  }

  clearSharedSessionSuspect(authType);

  annotate(
    "session-repaired",
    `${reason} found the shared session revoked (token ${staleToken}); signed ` +
      `in again and rewrote the shared session ` +
      `(repair ${sessionRepairs[authType]}/${MAX_SESSION_REPAIRS}).`,
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