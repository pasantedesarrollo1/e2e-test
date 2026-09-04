import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(rootDir, '.env');

try {
  process.loadEnvFile(envPath);
} catch {}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5175';
const chefURL = process.env.PLAYWRIGHT_CHEF_URL ?? 'https://localhost:8100';
const localChefURL = process.env.PLAYWRIGHT_LOCAL_CHEF_URL ?? 'http://localhost:8100';

const targetHostname = new URL(baseURL).hostname;
const isLocalTarget =
  targetHostname === 'localhost' ||
  targetHostname === '127.0.0.1' ||
  targetHostname.endsWith('.localhost');

const AUTH_DIR = path.join(rootDir, 'e2e', 'Wanqara', '.auth');
const CHEF_AUTH_DIR = path.join(rootDir, 'e2e', 'WanqaraChef', '.auth');

export default defineConfig({
  testDir: './e2e', 
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  maxFailures: process.env.CI ? 10 : 0,
  timeout: process.env.CI ? 120 * 1000 : 45 * 1000,
  expect: { timeout: process.env.CI ? 30 * 1000 : 10 * 1000 },

  reporter: process.env.CI ? [['list'], ['github'], ['html']] : 'html',

  use: {
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
    // ==========================================
    // WANQARA (POS / Admin) PROJECTS
    // ==========================================
    {
      name: 'setup',
      testMatch: /Wanqara\/.*\.setup\.js/,
      use: { baseURL }
    },
    {
      name: 'POS-Retail',
      dependencies: ['setup'],
      testMatch: /Wanqara\/regression\/POS\/(POS-C|common)\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    },
    {
      name: 'POS-Restaurant',
      dependencies: ['setup'],
      testMatch: /Wanqara\/regression\/POS\/POS-R\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: path.join(AUTH_DIR, 'restaurant-session.json'),
      },
    },
    {
      name: 'Admin-Inventory',
      dependencies: ['setup'],
      testMatch: /Wanqara\/regression\/(inventory|transactions|settings|people)\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    },
    {
      name: 'Smoke',
      dependencies: ['setup'],
      testMatch: /Wanqara\/smoke\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    },
    {
      name: 'Release',
      dependencies: ['setup'],
      testMatch: /Wanqara\/release\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        storageState: path.join(AUTH_DIR, 'retail-session.json'),
      },
    },

    // ==========================================
    // WANQARA CHEF (Meseros) PROJECTS
    // ==========================================
    {
      name: 'setup-chef-workstation',
      testMatch: /WanqaraChef.*harness.*auth\.workstation\.setup\.ts/,
      use: { baseURL: localChefURL } 
    },
    {
      name: 'Chef-Workstation',
      dependencies: ['setup-chef-workstation'],
      testMatch: /WanqaraChef.*regression.*\.workstation\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: localChefURL,
        storageState: path.join(CHEF_AUTH_DIR, 'session-workstation.json'),
      },
    },
    {
      name: 'setup-chef-personal',
      testMatch: /WanqaraChef.*harness.*auth\.personal\.setup\.ts/,
      use: { baseURL: localChefURL }
    },
    {
      name: 'Chef-Personal',
      dependencies: ['setup-chef-personal'],
      testMatch: /WanqaraChef.*regression.*\.personal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: localChefURL, 
        storageState: path.join(CHEF_AUTH_DIR, 'session-personal.json'),
      },
    },
    {
      name: 'Smoke-Chef-Workstation',
      dependencies: ['setup-chef-workstation'],
      testMatch: /WanqaraChef.*smoke.*\.workstation\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: localChefURL, 
        storageState: path.join(CHEF_AUTH_DIR, 'session-workstation.json'),
      },
    },
    {
      name: 'Smoke-Chef-Personal',
      dependencies: ['setup-chef-personal'],
      testMatch: /WanqaraChef.*smoke.*\.personal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: localChefURL,
        storageState: path.join(CHEF_AUTH_DIR, 'session-personal.json'),
      },
    }
  ],
});