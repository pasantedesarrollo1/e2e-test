import type { Page } from '@playwright/test';

export interface AdminFixtures {
  readinessSelector: string;
  adminApp: { page: Page; contextType: string };
}

export interface PosFixtures {
  cashRegisterSetup?: (page: Page, mode: string, amount: string, name: string, code: string, path: string) => Promise<void>;
  posEnvironment: { page: Page; contextType: string };
}

export interface StageFixtures {
  stageEnvironment: { adminPage: Page; chefPage: Page; posPage: Page; contextType: string };
}
