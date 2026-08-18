import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(rootDir, '.env');

try {
  process.loadEnvFile(envPath);
} catch {}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5175';
const targetHostname = new URL(baseURL).hostname;
const isLocalTarget =
  targetHostname === 'localhost' ||
  targetHostname === '127.0.0.1' ||
  targetHostname.endsWith('.localhost');

const AUTH_DIR = path.join(rootDir, 'e2e', 'Wanqara', '.auth');

export default defineConfig({
  testDir: './e2e/Wanqara',
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 2 : undefined,

  maxFailures: process.env.CI ? 10 : 0,
  timeout: process.env.CI ? 120 * 1000 : 45 * 1000,
  expect: { timeout: process.env.CI ? 30 * 1000 : 10 * 1000 },

  reporter: process.env.CI ? [['list'], ['github'], ['html']] : 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: process.env.CI ? 45 * 1000 : 15 * 1000,
    navigationTimeout: process.env.CI ? 60 * 1000 : 20 * 1000,
    bypassCSP: true,
    contextOptions: { reducedMotion: 'reduce' },
    launchOptions: isLocalTarget
      ? { args: ['--host-resolver-rules=MAP *.localhost 127.0.0.1'] }
      : {},
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'POS-Retail',
      dependencies: ['setup'],
      testMatch: /.*regression\/POS\/(POS-C|common)\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    },
    {
      name: 'POS-Restaurant',
      dependencies: ['setup'],
      testMatch: /.*regression\/POS\/POS-R\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'restaurant-session.json'),
      },
    },
    {
      name: 'Admin-Inventory',
      dependencies: ['setup'],
      testMatch: /.*regression\/(inventory|transactions|settings)\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    },
    {
      name: 'Smoke',
      dependencies: ['setup'],
      testMatch: /.*smoke\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    }
  ],

  webServer: (isLocalTarget && !process.env.CI)
    ? {
        command: 'npm run dev -- --port 5175',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : undefined,
});