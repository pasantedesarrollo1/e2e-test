// e2e/harness/config/settings.js

const tenantRuc = process.env.PLAYWRIGHT_TENANT_RUC;
if (!tenantRuc) throw new Error("❌ PLAYWRIGHT_TENANT_RUC no está definido en el archivo .env.");

const port = process.env.PLAYWRIGHT_WANQARA_PORT;
if (!port) throw new Error("❌ PLAYWRIGHT_WANQARA_PORT no está definido en el archivo .env.");

const baseUrl = `http://${tenantRuc}.localhost:${port}`;

export const playwrightHarness = {
  publicBaseUrl: baseUrl,
  tenantRuc,
  
  users: {
    actor1: {
      email: process.env.PLAYWRIGHT_ACTOR_1_EMAIL ?? process.env.PLAYWRIGHT_RESTAURANT_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_ACTOR_1_PASSWORD ?? process.env.PLAYWRIGHT_RESTAURANT_PASSWORD ?? ""},
    actor2: {
      email: process.env.PLAYWRIGHT_ACTOR_2_EMAIL ?? process.env.PLAYWRIGHT_DISPATCH_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_ACTOR_2_PASSWORD ?? process.env.PLAYWRIGHT_DISPATCH_PASSWORD ?? ""},
    actor3: {
      email: process.env.PLAYWRIGHT_ACTOR_3_EMAIL ?? process.env.PLAYWRIGHT_RETAIL_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_ACTOR_3_PASSWORD ?? process.env.PLAYWRIGHT_RETAIL_PASSWORD ?? ""}
  },

  seeded: {
    enabled: process.env.PLAYWRIGHT_SEEDED === "true",
    adminRoutes: []}};

export const chefHarness = {
  baseUrl: process.env.PLAYWRIGHT_CHEF_URL ?? "",
  users: {
    actor1: {
      ruc:      process.env.PLAYWRIGHT_CHEF_ACTOR_1_RUC ?? process.env.PLAYWRIGHT_CHEF_RUC ?? "",
      email:    process.env.PLAYWRIGHT_CHEF_ACTOR_1_EMAIL ?? process.env.PLAYWRIGHT_CHEF_EMAIL ?? "",
      password: process.env.PLAYWRIGHT_CHEF_ACTOR_1_PASSWORD ?? process.env.PLAYWRIGHT_CHEF_PASSWORD ?? ""
    }
  }
};

export const hasTenantData = () =>
  Boolean(playwrightHarness.publicBaseUrl && playwrightHarness.tenantRuc);

export const hasLoginCredentials = () => {
  const { actor1, actor2, actor3 } = playwrightHarness.users;
  return Boolean(
    actor1?.email && actor1?.password &&
    actor2?.email && actor2?.password &&
    actor3?.email && actor3?.password
  );
};

export const hasChefCredentials = () => {
  const actor1 = chefHarness.users.actor1;
  return Boolean(actor1?.ruc && actor1?.email && actor1?.password);
};

export const skipReloginTests = () =>
  process.env.PLAYWRIGHT_SKIP_RELOGIN === "true";

export const getTenantBaseUrl = () => playwrightHarness.publicBaseUrl;

export function requirePosCredentials(test) {
  test.skip(
    !hasTenantData() || !hasLoginCredentials(),
    "Requires PLAYWRIGHT_TENANT_RUC and all specific actor credentials (Actor 1, Actor 2, Actor 3)",
  );
}

export function requireChefCredentials(test) {
  test.skip(
    !hasChefCredentials(),
    "Requires PLAYWRIGHT_CHEF_RUC, PLAYWRIGHT_CHEF_EMAIL and PLAYWRIGHT_CHEF_PASSWORD",
  );
}
