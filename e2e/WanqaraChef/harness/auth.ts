import { expect, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageTestId, visibleTestId } from './ionic.js';
import {
  playwrightHarness,
  type WorkModeName,
} from './settings.js';

export { pageTestId, visibleTestId } from './ionic.js';

const harnessDir = path.dirname(fileURLToPath(import.meta.url));

export const SESSION_WORKSTATION_PATH = path.resolve(
  harnessDir,
  '../.auth/session-workstation.json',
);

export const SESSION_PERSONAL_PATH = path.resolve(
  harnessDir,
  '../.auth/session-personal.json',
);

async function fillIonInput(page: Page, testId: string, value: string) {
  const host = visibleTestId(page, testId);
  await expect(host).toBeVisible();
  const input = host.locator('input').first();
  await input.fill(value);
}

/** Ionic router-outlet often intercepts pointer events during transitions. */
async function clickStable(locator: Locator) {
  await expect(locator).toBeVisible({ timeout: 20_000 });
  await locator.click({ force: true });
}

/**
 * Click a control inside the active Ionic page by data-testid.
 * Playwright "visible" is unreliable here: cached ion-pages can still match.
 */
async function clickInActiveIonPage(page: Page, testId: string) {
  const clicked = await page.evaluate((id) => {
    const pages = [
      ...document.querySelectorAll(
        'ion-router-outlet > .ion-page:not(.ion-page-hidden):not(.ion-page-invisible), ion-router-outlet > ion-page:not(.ion-page-hidden):not(.ion-page-invisible)',
      ),
    ] as HTMLElement[];
    const active = pages.at(-1);
    const el = (active?.querySelector(`[data-testid="${id}"]`) ??
      document.querySelector(
        `.ion-page:not(.ion-page-hidden):not(.ion-page-invisible) [data-testid="${id}"]`,
      )) as HTMLElement | null;
    if (!el) return false;
    el.click();
    return true;
  }, testId);

  if (!clicked) {
    throw new Error(`No [data-testid="${testId}"] in active ion-page`);
  }
}

async function expectOnboardingStep(page: Page, step: 1 | 2 | 3) {
  await expect
    .poll(
      async () =>
        page.evaluate((n) => {
          const label = `Paso ${n} de 3`;
          const pages = [
            ...document.querySelectorAll(
              '.ion-page:not(.ion-page-hidden):not(.ion-page-invisible)',
            ),
          ] as HTMLElement[];
          return pages.some((p) => p.innerText?.includes(label));
        }, step),
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function clickOnboardingNext(page: Page, nextStep: 2 | 3) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const pages = [
            ...document.querySelectorAll(
              '.ion-page:not(.ion-page-hidden):not(.ion-page-invisible)',
            ),
          ] as HTMLElement[];
          const active = pages.at(-1);
          const btn = active?.querySelector(
            '[data-testid="onboarding-next"]',
          ) as HTMLButtonElement | null;
          if (!btn) return 'missing';
          if (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
            return 'disabled';
          }
          return 'ready';
        }),
      { timeout: 10_000 },
    )
    .toBe('ready');

  await clickInActiveIonPage(page, 'onboarding-next');
  await expectOnboardingStep(page, nextStep);
}

async function openRucForm(page: Page) {
  const rucInput = visibleTestId(page, 'ruc-input');
  const clientCta = visibleTestId(page, 'auth-client-cta');

  // Welcome CTA animates in (~600ms); wait for either surface before acting.
  await expect(rucInput.or(clientCta)).toBeVisible({ timeout: 20_000 });

  if (await rucInput.isVisible().catch(() => false)) {
    return;
  }

  await clientCta.click();
  await expect(rucInput).toBeVisible({ timeout: 20_000 });
}

export async function submitTenantRuc(page: Page, ruc = playwrightHarness.tenantRuc) {
  await page.goto('/auth/ruc');
  await openRucForm(page);
  await fillIonInput(page, 'ruc-input', ruc);
  await page.getByTestId('ruc-submit').click();
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
}

export async function loginWithRucAndUser(
  page: Page,
  {
    ruc = playwrightHarness.tenantRuc,
    email = playwrightHarness.login.email,
    password = playwrightHarness.login.password,
  } = {},
) {
  await submitTenantRuc(page, ruc);
  await fillIonInput(page, 'login-email', email);
  await fillIonInput(page, 'login-password', password);
  await page.getByTestId('login-submit').click();

  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 45_000 });
}

async function readPersistedWorkMode(page: Page): Promise<WorkModeName | null> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('config');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { config?: { workMode?: string } };
      const mode = parsed?.config?.workMode;
      if (mode === 'Workstation' || mode === 'Personal') return mode;
      return null;
    } catch {
      return null;
    }
  });
}

async function dismissPrintersIfPresent(page: Page) {
  if (!/\/config\/subsidiary-printers/.test(page.url())) return;

  const skip = page.getByRole('button', { name: /omitir|continuar|guardar|saltar/i }).first();
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ force: true });
  }
}

function normalizeSubsidiaryKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function selectSubsidiaryByEnv(page: Page) {
  const wanted = playwrightHarness.subsidiary;
  if (!wanted) {
    throw new Error('PLAYWRIGHT_SUBSIDIARY is required to complete onboarding');
  }

  const target = normalizeSubsidiaryKey(wanted);

  const value = await page
    .waitForFunction(
      (wantedKey) => {
        const normalize = (value: string) =>
          value
            .normalize('NFD')
            .replace(/\p{M}/gu, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

        const root =
          (
            [
              ...document.querySelectorAll(
                '.ion-page:not(.ion-page-hidden):not(.ion-page-invisible)',
              ),
            ] as HTMLElement[]
          ).at(-1) ?? document.body;

        const cards = [
          ...root.querySelectorAll('[data-testid="subsidiary-option"]'),
        ] as HTMLElement[];
        if (!cards.length) return null;

        const snapshot = cards.map((el, index) => ({
          index,
          label: el.getAttribute('data-subsidiary-label') ?? '',
          code: el.getAttribute('data-subsidiary-code') ?? '',
          name: el.getAttribute('data-subsidiary-name') ?? '',
          text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        }));

        const match = snapshot.find((card) => {
          const keys = [card.label, card.code, card.name, card.text]
            .filter(Boolean)
            .map((value) => normalize(value));
          return keys.some(
            (key) =>
              key === wantedKey || key.includes(wantedKey) || wantedKey.includes(key),
          );
        });

        if (!match) {
          return { status: 'no-match' as const, snapshot };
        }

        const selected = cards[match.index];
        if (!selected?.className?.includes('ring-primary')) {
          selected?.click();
        }

        if (!selected?.className?.includes('ring-primary')) {
          return null;
        }

        return { status: 'ok' as const, label: match.label };
      },
      target,
      { timeout: 20_000 },
    )
    .then((handle) => handle.jsonValue())
    .catch(() => null);

  if (!value || value.status !== 'ok') {
    throw new Error(
      `No subsidiary matched PLAYWRIGHT_SUBSIDIARY="${wanted}". Last: ${JSON.stringify(value)}`,
    );
  }
}

/**
 * UserOnboarding wizard: subsidiary → printer (mobile default) → work mode → Finalizar.
 */
export async function completeOnboardingWizard(page: Page, mode: WorkModeName) {
  const onWizard =
    /\/config\/user-onboarding/.test(page.url()) ||
    (await page.getByRole('heading', { name: /sucursal/i }).isVisible().catch(() => false));

  if (!onWizard) return false;

  await expectOnboardingStep(page, 1);

  // Step 1: subsidiary
  await selectSubsidiaryByEnv(page);
  await clickOnboardingNext(page, 2);

  // Step 2: mobile printer auto-selects on mount; click explicitly for determinism.
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            !!document.querySelector(
              '.ion-page:not(.ion-page-hidden):not(.ion-page-invisible) [data-testid="printer-option-first"]',
            ),
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
  await clickInActiveIonPage(page, 'printer-option-first');
  await clickOnboardingNext(page, 3);

  // Step 3: work mode (Personal is default; still click the target mode).
  const modeTestId = mode === 'Workstation' ? 'work-mode-workstation' : 'work-mode-personal';
  await expect
    .poll(
      async () =>
        page.evaluate(
          (id) =>
            !!document.querySelector(
              `.ion-page:not(.ion-page-hidden):not(.ion-page-invisible) [data-testid="${id}"]`,
            ),
          modeTestId,
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
  await clickInActiveIonPage(page, modeTestId);
  await clickInActiveIonPage(page, 'onboarding-finish');

  await page.waitForURL(/\/(tables|check-responsible)/, { timeout: 60_000 });
  return true;
}

/** Legacy InitialConfig screen (subsidiary + work mode in one form). */
async function completeInitialConfig(page: Page, mode: WorkModeName) {
  const submit = page.getByTestId('initial-config-submit');
  const onInitialConfig =
    /\/config\/initial-config/.test(page.url()) ||
    (await submit.isVisible().catch(() => false));

  if (!onInitialConfig) return false;

  await selectSubsidiaryByEnv(page);

  const modeTestId = mode === 'Workstation' ? 'work-mode-workstation' : 'work-mode-personal';
  await clickStable(page.getByTestId(modeTestId));
  await clickStable(submit);
  return true;
}

async function changeWorkModeViaMenu(page: Page, mode: WorkModeName) {
  const menu = visibleTestId(page, 'tables-menu-button');
  await expect(menu).toBeVisible({ timeout: 20_000 });
  await menu.click();
  await page.getByText('Cambiar de modalidad de trabajo', { exact: true }).click();

  const modeTestId =
    mode === 'Workstation' ? 'change-work-mode-workstation' : 'change-work-mode-personal';
  await expect(page.getByTestId(modeTestId)).toBeVisible({ timeout: 15_000 });
  await page.getByTestId(modeTestId).click();
  await page.getByTestId('change-config-save').click();
}

export async function completeWorkstationPin(
  page: Page,
  code = playwrightHarness.workstationCode,
) {
  await expect(page).toHaveURL(/\/check-responsible/, { timeout: 30_000 });
  await fillIonInput(page, 'workstation-pin-input', code);
  await page.getByTestId('workstation-pin-submit').click();
  await expect(page).toHaveURL(/\/tables/, { timeout: 30_000 });
}

async function waitForPostLoginSurface(page: Page) {
  await page.waitForURL(
    /\/(tables|check-responsible|config\/)/,
    { timeout: 45_000 },
  );
  await dismissPrintersIfPresent(page);
}

/**
 * After login, force the desired work mode and land on /tables.
 * Workstation requires PIN; Personal does not.
 */
export async function ensureWorkMode(page: Page, mode: WorkModeName) {
  await page.waitForLoadState('domcontentloaded');
  await waitForPostLoginSurface(page);

  const didWizard = await completeOnboardingWizard(page, mode);
  if (!didWizard) {
    await completeInitialConfig(page, mode);
  }
  await dismissPrintersIfPresent(page);

  // Still on config after partial navigation (e.g. printers route).
  if (/\/config\//.test(page.url())) {
    await waitForPostLoginSurface(page);
    if (/\/config\/user-onboarding/.test(page.url())) {
      await completeOnboardingWizard(page, mode);
    } else if (/\/config\/initial-config/.test(page.url())) {
      await completeInitialConfig(page, mode);
    }
  }

  let currentMode = await readPersistedWorkMode(page);

  if (mode === 'Workstation') {
    if (/\/check-responsible/.test(page.url())) {
      await completeWorkstationPin(page);
      return;
    }

    if (/\/tables/.test(page.url()) && currentMode !== 'Workstation') {
      await changeWorkModeViaMenu(page, 'Workstation');
      await expect(page).toHaveURL(/\/check-responsible/, { timeout: 30_000 });
      await completeWorkstationPin(page);
      return;
    }

    if (/\/tables/.test(page.url())) {
      await page.goto('/tables');
      if (/\/check-responsible/.test(page.url())) {
        await completeWorkstationPin(page);
      }
      await expect(page).toHaveURL(/\/tables/);
      return;
    }

    throw new Error(`Workstation setup stuck at unexpected URL: ${page.url()}`);
  }

  // Personal
  if (/\/check-responsible/.test(page.url())) {
    if (!playwrightHarness.workstationCode) {
      throw new Error(
        'Landed on PIN screen while targeting Personal mode, but PLAYWRIGHT_WORKSTATION_CODE is missing',
      );
    }
    await completeWorkstationPin(page);
    currentMode = await readPersistedWorkMode(page);
  }

  if (/\/tables/.test(page.url()) && currentMode !== 'Personal') {
    await changeWorkModeViaMenu(page, 'Personal');
  }

  await expect(page).toHaveURL(/\/tables/, { timeout: 45_000 });
  await expect(page).not.toHaveURL(/\/check-responsible/);
}

export async function loginWorkstation(page: Page) {
  await loginWithRucAndUser(page);
  await ensureWorkMode(page, 'Workstation');
  await expect(pageTestId(page, 'tables-hub')).toBeVisible({ timeout: 30_000 });
}

export async function loginPersonal(page: Page) {
  await loginWithRucAndUser(page);
  await ensureWorkMode(page, 'Personal');
  await expect(pageTestId(page, 'tables-hub')).toBeVisible({ timeout: 30_000 });
}
