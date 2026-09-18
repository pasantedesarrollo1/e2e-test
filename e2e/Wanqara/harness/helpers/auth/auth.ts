import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwrightHarness, type UserCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { formatPosSubsidiary, selectDropdownOption } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

export const getSessionPath = (authType: string): string => path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../../.auth/${authType}-session.json`,
);

export async function loginWithEmailPassword(page: Page, { email, password }: UserCredentials): Promise<void> {
  await page.locator('input[type="email"]').fill(email ?? "");
  await page.locator('input[type="password"]').fill(password ?? "");
  await page.getByRole("button", { name: /Iniciar/i }).click();
  await expect(page).not.toHaveURL(/\/login(\/|$)/);
}

export interface LoginAndSelectOptions {
  login: UserCredentials;
  subsidiaryName?: string;
  subsidiaryCode?: string;
}

export async function loginAndSelectSubsidiary(page: Page, { login, subsidiaryName, subsidiaryCode }: LoginAndSelectOptions): Promise<void> {
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
    // 
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

export interface LogoutOptions {
  navigateToHome?: boolean;
}

export async function logoutFromSession(page: Page, { navigateToHome = true }: LogoutOptions = {}): Promise<void> {
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

export async function logoutAndLoginAgain(page: Page, { login, subsidiaryName, subsidiaryCode }: LoginAndSelectOptions): Promise<void> {
  await logoutFromSession(page);
  await loginAndSelectSubsidiary(page, { login, subsidiaryName, subsidiaryCode });
}

const LOGIN_URL_PATTERN = /\/login(\/|$)/;

const isOnLogin = (page: Page): boolean => LOGIN_URL_PATTERN.test(new URL(page.url()).pathname);

export async function withSessionWatchdog<T>(page: Page, body: () => Promise<T>, authType: string = "actor3"): Promise<T> {
  const redirectedToLogin = (async (): Promise<T> => {
    try {
      await page.waitForURL(LOGIN_URL_PATTERN);
    } catch {
      return new Promise<T>(() => {});
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

const getSuspectPath = (authType: string): string => path.join(path.dirname(getSessionPath(authType)), `${authType}-session-suspect`);

const markSharedSessionSuspect = (authType: string): void => {
  try {
    const suspectPath = getSuspectPath(authType);
    fs.mkdirSync(path.dirname(suspectPath), { recursive: true });
    fs.writeFileSync(suspectPath, new Date().toISOString());
  } catch {
    // 
  }
};

export const isSharedSessionSuspect = (authType: string): boolean => fs.existsSync(getSuspectPath(authType));

export const clearSharedSessionSuspect = (authType: string): void => {
  try {
    fs.rmSync(getSuspectPath(authType), { force: true });
  } catch {
    // 
  }
};

const annotate = (type: string, description: string): void => {
  try {
    test.info().annotations.push({ type, description });
  } catch {
    // 
  }
};

interface RepairOptions {
  authType: string;
}

interface CustomTestInfo {
  _sessionRepairs?: Record<string, number>;
}

async function repairSharedSession(page: Page, { authType }: RepairOptions): Promise<boolean> {
  let repairs: Record<string, number>;
  try {
    const info = test.info() as unknown as CustomTestInfo;
    if (!info._sessionRepairs) info._sessionRepairs = {};
    repairs = info._sessionRepairs;
  } catch {
    repairs = {};
  }

  const count = repairs[authType] ?? 0;
  if (count >= MAX_SESSION_REPAIRS) return false;
  repairs[authType] = count + 1;

  const login = playwrightHarness.users[authType as keyof typeof playwrightHarness.users];
  if (!login) throw new Error(`No credentials configured for authType "${authType}".`);
  const defaultBranches = JSON.parse(
    fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../config/default-branches.json"), "utf-8")
  ) as Record<string, { name: string; code: string }>;

  const subsidiaryConfig = defaultBranches[authType];
  if (!subsidiaryConfig) throw new Error(`No default branch configured for authType "${authType}".`);
  
  const subsidiaryName = subsidiaryConfig.name;
  const subsidiaryCode = subsidiaryConfig.code;

  await loginAndSelectSubsidiary(page, {
    login,
    subsidiaryName,
    subsidiaryCode
  });
  await page.context().storageState({ path: getSessionPath(authType) });

  return true;
}

export interface EnsureAuthOptions {
  targetPath: string;
  authType?: string;
}

export async function ensureAuthenticated(page: Page, { targetPath, authType = "actor3" }: EnsureAuthOptions): Promise<void> {
  const url = targetPath;
  if (isSharedSessionSuspect(authType)) {
    await recoverSharedSession(page, { reason: "a previous attempt", authType });
  }

  await page.goto(url);
  
  try {
    await page.waitForURL(LOGIN_URL_PATTERN, { timeout: 2000 });
  } catch {
    // 
  }

  if (isOnLogin(page)) {
    await recoverSharedSession(page, { reason: targetPath, authType });
    await page.goto(url);

    try {
      await page.waitForURL(LOGIN_URL_PATTERN, { timeout: 2000 });
    } catch {//
      }

    if (isOnLogin(page)) {
      throw new Error(
        `Re-login did not restore the session: ${targetPath} still redirects to ` +
          `${page.url()}. Credentials or the tenant may be wrong.`,
      );
    }
  }
}

export interface RecoverSessionOptions {
  reason: string;
  authType: string;
}

export async function recoverSharedSession(page: Page, { reason, authType }: RecoverSessionOptions): Promise<void> {
  if (!(await repairSharedSession(page, { authType }))) {
    throw new Error(
      `Shared session died ${MAX_SESSION_REPAIRS} times in this run. ` +
        `Something keeps signing in with the same account - a concurrent ` +
        `CI job, or a stray login. Re-run with PLAYWRIGHT_AUTH_DEBUG=1 to ` +
        `see who mints the replacements.`,
    );
  }

  clearSharedSessionSuspect(authType);

  const info = test.info() as unknown as CustomTestInfo;
  const currentRepair = info._sessionRepairs ? info._sessionRepairs[authType] : 1;

  annotate(
    "session-repaired",
    `${reason} found the shared session revoked; signed in again and rewrote ` +
      `the shared session (repair ${currentRepair}/${MAX_SESSION_REPAIRS}).`,
  );
}

export async function switchAdminSubsidiary(page: Page, targetSubsidiaryName: string, targetSubsidiaryCode?: string): Promise<void> {
  const targetSubsidiary = formatPosSubsidiary(targetSubsidiaryName, targetSubsidiaryCode);
  const shortName = targetSubsidiary.split(" - ").pop()?.trim() ?? "";

  const headerText = await page.locator("header").first().innerText();
  if (headerText.includes(shortName)) {
    return; 
  }

  const profileBtn = page.locator("header").first().locator("button").filter({ hasText: /Wanqara/i }).first();
  await profileBtn.click();

  const profileModal = page.locator(".v-overlay__content").filter({ hasText: /Mi Perfil/i }).first();
  await expect(profileModal).toBeVisible({ timeout: 5000 });

  const branchSelect = profileModal.locator(".v-select").first();
  
  await selectDropdownOption(page, {
    triggerLocator: branchSelect,
    optionText: targetSubsidiary
  });

  await page.mouse.click(0, 0);
  await page.keyboard.press("Escape");
  await expect(profileModal).not.toBeVisible({ timeout: 5000 });

  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState("networkidle");
  await expect(
    page.locator("header").first().locator("button").filter({ hasText: new RegExp(shortName, "i") }).first()
  ).toBeVisible({ timeout: 15000 });
}

export async function withSessionRetry<T>(page: Page, authType: string, actionFn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await actionFn();
    } catch (error: unknown) {
      const isLoginUrl = isOnLogin(page);
      const isExpiredSnackbarVisible = await page
        .locator(".v-snackbar")
        .filter({ hasText: /Sesión expirada/i })
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      if (isLoginUrl || isExpiredSnackbarVisible) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`Sesión expirada y no se pudo recuperar tras ${maxRetries} intentos. Error original: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        await recoverSharedSession(page, { reason: "session expired mid-action", authType });
      } else {
        throw error;
      }
    }
  }
  throw new Error("withSessionRetry failed");
}
