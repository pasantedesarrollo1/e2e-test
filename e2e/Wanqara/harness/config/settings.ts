import { buildSafeTenantUrl } from '@/e2e/Wanqara/harness/helpers/url-builder.js';
import type { TestType } from '@playwright/test';

export interface UserCredentials {
  email?: string;
  password?: string;
}

export interface ChefUserCredentials extends UserCredentials {
  ruc?: string;
}

export interface PlaywrightHarnessConfig {
  publicBaseUrl: string;
  tenantRuc: string;
  users: {
    actor1: UserCredentials;
    actor2: UserCredentials;
    actor3: UserCredentials;
  };
  seeded: {
    enabled: boolean;
    adminRoutes: string[];
  };
}

export interface ChefHarnessConfig {
  baseUrl: string;
  users: {
    actor1: ChefUserCredentials;
  };
}

const tenantRuc = process.env.PLAYWRIGHT_TENANT_RUC;
if (!tenantRuc) throw new Error("❌ PLAYWRIGHT_TENANT_RUC is not defined in the .env file.");
const rawWanqaraUrl = process.env.PLAYWRIGHT_WANQARA_URL;
const baseUrl = buildSafeTenantUrl(rawWanqaraUrl, tenantRuc);

export const playwrightHarness: PlaywrightHarnessConfig = {
  publicBaseUrl: baseUrl,
  tenantRuc,
  
  users: {
    actor1: {
      email: process.env.PLAYWRIGHT_ACTOR_1_EMAIL ?? process.env.PLAYWRIGHT_RESTAURANT_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_ACTOR_1_PASSWORD ?? process.env.PLAYWRIGHT_RESTAURANT_PASSWORD ?? ""},
    actor2: {
      email: process.env.PLAYWRIGHT_ACTOR_2_EMAIL ?? process.env.PLAYWRIGHT_DISPATCH_EMAIL ?? process.env.PLAYWRIGHT_ACTOR_1_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_ACTOR_2_PASSWORD ?? process.env.PLAYWRIGHT_DISPATCH_PASSWORD ?? process.env.PLAYWRIGHT_ACTOR_1_PASSWORD ?? ""},
    actor3: {
      email: process.env.PLAYWRIGHT_ACTOR_3_EMAIL ?? process.env.PLAYWRIGHT_RETAIL_EMAIL ?? process.env.PLAYWRIGHT_ACTOR_1_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_ACTOR_3_PASSWORD ?? process.env.PLAYWRIGHT_RETAIL_PASSWORD ?? process.env.PLAYWRIGHT_ACTOR_1_PASSWORD ?? ""}
  },

  seeded: {
    enabled: process.env.PLAYWRIGHT_SEEDED === "true",
    adminRoutes: []}
};

export const chefHarness: ChefHarnessConfig = {
  baseUrl: process.env.PLAYWRIGHT_CHEF_URL ?? "",
  users: {
    actor1: {
      ruc:      process.env.PLAYWRIGHT_TENANT_RUC ?? "",
      email:    process.env.PLAYWRIGHT_CHEF_ACTOR_1_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_CHEF_ACTOR_1_PASSWORD ?? ""
    }
  }
};

export const hasTenantData = (): boolean =>
  Boolean(playwrightHarness.publicBaseUrl && playwrightHarness.tenantRuc);

export const hasLoginCredentials = (): boolean => {
  const { actor1, actor2, actor3 } = playwrightHarness.users;
  return Boolean(
    actor1?.email && actor1?.password &&
    actor2?.email && actor2?.password &&
    actor3?.email && actor3?.password
  );
};

export const hasChefCredentials = (): boolean => {
  const actor1 = chefHarness.users.actor1;
  return Boolean(actor1?.ruc && actor1?.email && actor1?.password);
};

export const skipReloginTests = (): boolean =>
  process.env.PLAYWRIGHT_SKIP_RELOGIN === "true";

export const getTenantBaseUrl = (): string => playwrightHarness.publicBaseUrl;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requirePosCredentials(test: TestType<any, any>): void {
  test.skip(
    !hasTenantData() || !hasLoginCredentials(),
    "Requires PLAYWRIGHT_TENANT_RUC and all specific actor credentials (Actor 1, Actor 2, Actor 3)",
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireChefCredentials(test: TestType<any, any>): void {
  test.skip(
    !hasChefCredentials(),
    "Requires PLAYWRIGHT_CHEF_RUC, PLAYWRIGHT_CHEF_EMAIL and PLAYWRIGHT_CHEF_PASSWORD",
  );
}
