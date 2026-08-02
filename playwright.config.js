import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * E2E settings (base URL, tenant RUC, login credentials) are read from `.env`
 * here and consumed in e2e/harness/settings.js. See `.env.example`. When no
 * `.env` exists, the harness guards skip credential-dependent tests.
 */
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env');
try {
  process.loadEnvFile(envPath);
} catch {
  // No .env file (or unsupported Node) — fall back to real environment vars.
}

/**
 * Frontend URL under test. Locally this is the dev server; in CI it is the
 * deployed develop environment (set via the PLAYWRIGHT_BASE_URL secret). This
 * must be the FRONTEND host, not the API endpoint.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5175';
const targetHostname = new URL(baseURL).hostname;
const isLocalTarget =
  targetHostname === 'localhost' ||
  targetHostname === '127.0.0.1' ||
  targetHostname.endsWith('.localhost');

const SESSION_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'e2e', '.auth', 'session.json',
);

/**
 * Session model: auth.setup.js signs in once and every spec reuses that token
 * via storageState. The backend keeps one live token per user, so signing in
 * again revokes it and the next request made with the old token comes back 401
 * — which the app treats as an expired session and bounces to /login.
 *
 * So: no spec may sign in while shared-session specs still have to run. The one
 * spec that must — sale-inventory-dispatch.spec.js, which tests re-login
 * behaviour — lives in e2e/regression/zz-relogin/ so it sorts last, opts out of
 * storageState, and re-mints e2e/.auth/session.json in afterAll as a backstop.
 * Keep that directory sorting after every other spec directory.
 *
 * Splitting those specs into a project that depends on `chromium` looks like a
 * tidier fix, but Playwright runs dependency projects unfiltered — the
 * regression job would drag the entire smoke suite in with them.
 *
 * PLAYWRIGHT_AUTH_DEBUG=1 traces token handover; see e2e/harness/auth-debug.js.
 */

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e', 
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  /* One retry locally too: a session revoked mid-test is infrastructure noise,
     not a route failure. ensureAuthenticated repairs the session, so the retry
     starts clean and the test is reported flaky rather than failed. */
  retries: process.env.CI ? 2 : 1,
  workers: 1,

  /* With workers=1, retries=2 and a 120s cap, a handful of broken tests can eat
     the whole job budget and the run gets killed before it reports anything.
     Bailing out leaves a usable report instead of a workflow timeout. */
  maxFailures: process.env.CI ? 10 : 0,

  timeout: process.env.CI ? 120 * 1000 : 30 * 1000,

  /* Bound how long a single failing assertion waits. Individual tests can still
     opt into longer waits (e.g. `expect(...).toBeVisible({ timeout })`). */
  expect: { timeout: process.env.CI ? 30 * 1000 : 10 * 1000 },
  
  reporter: process.env.CI ? [['list'], ['github'], ['html']] : 'html',
  
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Without these, Playwright's default action timeout is 0 (wait forever),
       so one mistargeted click/fill stalls until the per-test cap (up to 120s)
       before failing. Bounding them makes broken locators fail fast. */
    actionTimeout: process.env.CI ? 45 * 1000 : 15 * 1000,
    
    navigationTimeout: process.env.CI ? 60 * 1000 : 30 * 1000,
    
    bypassCSP: true,
    contextOptions: { reducedMotion: 'reduce' }
  },
  
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: SESSION_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: SESSION_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: SESSION_PATH,
      },
      dependencies: ['setup'],
    },
  ],
  
  /* Serve the app on localhost:5175 when the target is local. In CI we serve
     the built app with `vite preview` (the workflow runs `npm run build`
     first); locally we use the dev server so no build is required. When
     PLAYWRIGHT_BASE_URL points at a remote host, nothing is started. */
  webServer: isLocalTarget
    ? {
        command: process.env.CI ? 'npm run preview' : 'npm run dev -- --port 5175',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,
});