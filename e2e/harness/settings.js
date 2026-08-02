// e2e/harness/settings.js

import { assertNonProductionBaseUrl } from "./urls.js";
import { buildTenantBaseUrl } from "./urls.js";

const baseUrl = assertNonProductionBaseUrl(
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5175",
);

export const playwrightHarness = {
  publicBaseUrl: baseUrl,
  tenantRuc: process.env.PLAYWRIGHT_TENANT_RUC ?? "",
  login: {
    email: process.env.PLAYWRIGHT_LOGIN_EMAIL ?? "",
    password: process.env.PLAYWRIGHT_LOGIN_PASSWORD ?? "",
  },
  seeded: {
    enabled: process.env.PLAYWRIGHT_SEEDED !== "false",
    adminRoutes: [],
  },
};

export const chefHarness = {
  baseUrl: process.env.PLAYWRIGHT_CHEF_URL ?? "https://chef.wanqara360.org",
  login: {
    ruc:      process.env.PLAYWRIGHT_CHEF_RUC ?? "",
    email:    process.env.PLAYWRIGHT_CHEF_EMAIL ?? "",
    password: process.env.PLAYWRIGHT_CHEF_PASSWORD ?? "",
  },
};

export const hasTenantData = () =>
  Boolean(playwrightHarness.publicBaseUrl && playwrightHarness.tenantRuc);

export const hasLoginCredentials = () =>
  Boolean(playwrightHarness.login.email && playwrightHarness.login.password);

export const hasChefCredentials = () =>
  Boolean(chefHarness.login.ruc && chefHarness.login.email && chefHarness.login.password);

export const skipReloginTests = () =>
  process.env.PLAYWRIGHT_SKIP_RELOGIN === "true";

export const getTenantBaseUrl = () =>
  buildTenantBaseUrl(playwrightHarness.publicBaseUrl, playwrightHarness.tenantRuc);

export function requirePosCredentials(test) {
  test.skip(
    !hasTenantData() || !hasLoginCredentials(),
    "Requires PLAYWRIGHT_TENANT_RUC and login credentials",
  );
}

export function requireChefCredentials(test) {
  test.skip(
    !hasChefCredentials(),
    "Requires PLAYWRIGHT_CHEF_RUC, PLAYWRIGHT_CHEF_EMAIL and PLAYWRIGHT_CHEF_PASSWORD",
  );
}