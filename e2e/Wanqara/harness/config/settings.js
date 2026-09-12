// e2e/harness/config/settings.js

import { assertNonProductionBaseUrl } from "./urls.js";
import { buildTenantBaseUrl } from "./urls.js";


// Validar Base URL central
const rawBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
if (!rawBaseUrl) {
  console.warn("⚠️ PLAYWRIGHT_BASE_URL no está en .env, usando fallback http://localhost:5175");
}
const baseUrl = assertNonProductionBaseUrl(rawBaseUrl ?? "http://localhost:5175");

export const playwrightHarness = {
  publicBaseUrl: baseUrl,
  tenantRuc: process.env.PLAYWRIGHT_TENANT_RUC ?? "",
  
  users: {
    retail: {
      email: process.env.PLAYWRIGHT_RETAIL_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_RETAIL_PASSWORD ?? "",
    },
    dispatch: {
      email: process.env.PLAYWRIGHT_DISPATCH_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_DISPATCH_PASSWORD ?? "",
    },
    restaurant: {
      email: process.env.PLAYWRIGHT_RESTAURANT_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_RESTAURANT_PASSWORD ?? "",
    }
  },

  // Datos de negocio (limpios de falbacks mágicos en .env)
  subsidiaries: {
    retail: 'Wanqara Comercios 100',
    dispatch: 'Wanqara Comercios Dispatch 101',
    restaurant: 'Wanqara 001',
  },
  
  seeded: {
    enabled: process.env.PLAYWRIGHT_SEEDED === "true",
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

export const hasLoginCredentials = () => {
  const { retail, dispatch, restaurant } = playwrightHarness.users;
  return Boolean(
    retail.email && retail.password &&
    dispatch.email && dispatch.password &&
    restaurant.email && restaurant.password
  );
};

export const hasChefCredentials = () =>
  Boolean(chefHarness.login.ruc && chefHarness.login.email && chefHarness.login.password);

export const skipReloginTests = () =>
  process.env.PLAYWRIGHT_SKIP_RELOGIN === "true";

export const getTenantBaseUrl = () =>
  buildTenantBaseUrl(playwrightHarness.publicBaseUrl, playwrightHarness.tenantRuc);

export function requirePosCredentials(test) {
  test.skip(
    !hasTenantData() || !hasLoginCredentials(),
    "Requires PLAYWRIGHT_TENANT_RUC and all specific user credentials (Retail, Dispatch, Restaurant)",
  );
}

export function requireChefCredentials(test) {
  test.skip(
    !hasChefCredentials(),
    "Requires PLAYWRIGHT_CHEF_RUC, PLAYWRIGHT_CHEF_EMAIL and PLAYWRIGHT_CHEF_PASSWORD",
  );
}
