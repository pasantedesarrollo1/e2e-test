import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwrightHarness } from "../../config/settings.js";
export const getSessionPath = (authType) => path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../../.auth/${authType}-session.json`,
);

export async function loginWithEmailPassword(page, { email, password }) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /Iniciar/i }).click();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

import { formatPosSubsidiary } from "../ui/ui-helpers.js";

export async function loginAndSelectSubsidiary(page, { login, subsidiaryName, subsidiaryCode }) {
  await page.goto("/login");
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
    // Timeout is expected if not redirected
  }

  const listContainer = page.locator("div.tw-space-y-3.tw-mb-8.tw-max-h-64.tw-overflow-y-auto");
  const formattedName = subsidiaryName ? formatPosSubsidiary(subsidiaryName, subsidiaryCode) : null;
  const targetCard = formattedName
    ? listContainer.locator(".v-card").filter({ hasText: formattedName }).first()
    : listContainer.locator(".v-card").first();

  await targetCard.click();

  const continueButton = page.getByRole("button", { name: /Continuar/i }).first();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page).not.toHaveURL(/\/select-subsidiary(\/|$)/);
}

export async function logoutFromSession(page, { navigateToHome = true } = {}) {
  if (navigateToHome) {
    await page.goto("/admin/home");
    await expect(page).not.toHaveURL(/\/login(\/|$)/);
  }

  const profileMenu = page.locator(".tw-text-sm.tw-font-semibold").first();
  await profileMenu.click();

  const logoutButton = page.getByRole("button", { name: "Cerrar Sesión", exact: true });
  await logoutButton.click();

  await expect(page).toHaveURL(/\/login(\/|$)/);
}

export async function logoutAndLoginAgain(page, { login, subsidiaryName, subsidiaryCode }) {
  await logoutFromSession(page);
  await loginAndSelectSubsidiary(page, { login, subsidiaryName, subsidiaryCode });
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

const getSuspectPath = (authType) => path.join(path.dirname(getSessionPath(authType)), `${authType}-session-suspect`);

const markSharedSessionSuspect = (authType) => {
  try {
    const suspectPath = getSuspectPath(authType);
    fs.mkdirSync(path.dirname(suspectPath), { recursive: true });
    fs.writeFileSync(suspectPath, new Date().toISOString());
  } catch {
    // Ignore error if unable to mark suspect
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
    // Ignore if outside test context
  }
};

async function repairSharedSession(page, { authType }) {
  let repairs;
  try {
    const info = test.info();
    if (!info._sessionRepairs) info._sessionRepairs = {};
    repairs = info._sessionRepairs;
  } catch {
    repairs = {};
  }

  const count = repairs[authType] ?? 0;
  if (count >= MAX_SESSION_REPAIRS) return false;
  repairs[authType] = count + 1;

  const login = playwrightHarness.users[authType];
  if (!login) throw new Error(`No credentials configured for authType "${authType}".`);
  const defaultBranches = JSON.parse(
    fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../config/default-branches.json"), "utf-8")
  );

  const fallbackSubsidiaries = {
    retail: { name: defaultBranches.retail.name, code: defaultBranches.retail.code },
    dispatch: { name: defaultBranches.dispatch.name, code: defaultBranches.dispatch.code },
    restaurant: { name: defaultBranches.restaurant.name, code: defaultBranches.restaurant.code },
    admin: { name: defaultBranches.retail.name, code: defaultBranches.retail.code },
    chef: { name: defaultBranches.restaurant.name, code: defaultBranches.restaurant.code }
  };
  const subsidiaryName = fallbackSubsidiaries[authType].name;
  const subsidiaryCode = fallbackSubsidiaries[authType].code;

  await loginAndSelectSubsidiary(page, {
    login,
    subsidiaryName,
    subsidiaryCode
  });
  await page.context().storageState({ path: getSessionPath(authType) });

  return true;
}

export async function ensureAuthenticated(page, { targetPath, authType = "retail" }) {
  const url = targetPath;
  if (isSharedSessionSuspect(authType)) {
    await recoverSharedSession(page, { reason: "a previous attempt", authType });
  }

  await page.goto(url);
  if (isOnLogin(page)) {
    await recoverSharedSession(page, { reason: targetPath, authType });
    await page.goto(url);

    if (isOnLogin(page)) {
      throw new Error(
        `Re-login did not restore the session: ${targetPath} still redirects to ` +
          `${page.url()}. Credentials or the tenant may be wrong.`,
      );
    }
  }
}

async function recoverSharedSession(page, { reason, authType }) {
  if (!(await repairSharedSession(page, { authType }))) {
    throw new Error(
      `Shared session died ${MAX_SESSION_REPAIRS} times in this run. ` +
        `Something keeps signing in with the same account - a concurrent ` +
        `CI job, or a stray login. Re-run with PLAYWRIGHT_AUTH_DEBUG=1 to ` +
        `see who mints the replacements.`,
    );
  }

  clearSharedSessionSuspect(authType);

  const info = test.info();
  const currentRepair = info._sessionRepairs ? info._sessionRepairs[authType] : 1;

  annotate(
    "session-repaired",
    `${reason} found the shared session revoked; signed in again and rewrote ` +
      `the shared session (repair ${currentRepair}/${MAX_SESSION_REPAIRS}).`,
  );
}


