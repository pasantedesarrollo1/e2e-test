import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'playwright.config.ts',
    'e2e/**/*.spec.ts',
    'e2e/**/harness/**/*.ts',
    'e2e/**/fixtures/**/*.ts',
    'e2e/**/setups/**/*.ts',
    'e2e/**/helpers/**/*.ts',
  ],
  project: [
    'e2e/**/*.ts',
    'playwright.config.ts',
  ],
  ignore: [
    '.agents/**',
    '.playwright/**',
    'playwright-report/**',
    'test-results/**',
    '.auth/**',
  ],
};

export default config;