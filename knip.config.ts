import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'e2e/**/*.spec.ts',
    'e2e/**/harness/**/*.ts',
    'e2e/**/fixtures/**/*.ts',
    'e2e/**/setups/**/*.ts',
    'e2e/**/helpers/**/*.ts',
    'e2e/Wanqara/tools/seed-environment.ts',
  ],
  project: [
    'e2e/**/*.ts',
  ],
  ignoreDependencies: [
    '@playwright/mcp'
  ]
};

export default config;