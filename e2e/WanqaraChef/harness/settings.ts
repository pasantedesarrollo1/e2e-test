/** Strip quotes left by process.loadEnvFile / pasted .env values. */
function env(name: string, fallback = ''): string {
  const raw = process.env[name] ?? fallback;
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const baseUrl = env('PLAYWRIGHT_BASE_URL', 'http://localhost:8100');

export type WorkModeName = 'Workstation' | 'Personal';

export const playwrightHarness = {
  baseUrl,
  tenantRuc: env('PLAYWRIGHT_TENANT_RUC'),
  login: {
    email: env('PLAYWRIGHT_LOGIN_EMAIL'),
    password: env('PLAYWRIGHT_LOGIN_PASSWORD'),
  },
  workstationCode: env('PLAYWRIGHT_WORKSTATION_CODE'),
  /** Matches subsidiary card text: code, commercial_name, or "code - commercial_name". */
  subsidiary: env('PLAYWRIGHT_SUBSIDIARY'),
};

export const hasTenantRuc = () => Boolean(playwrightHarness.tenantRuc);

export const hasLoginCredentials = () =>
  Boolean(playwrightHarness.login.email && playwrightHarness.login.password);

export const hasWorkstationCode = () => Boolean(playwrightHarness.workstationCode);

export const hasSubsidiary = () => Boolean(playwrightHarness.subsidiary);

export const hasFullCredentials = () =>
  hasTenantRuc() && hasLoginCredentials() && hasSubsidiary();

export function requireCredentials(test: {
  skip: (condition: boolean, description: string) => void;
}) {
  test.skip(
    !hasFullCredentials(),
    'Requires PLAYWRIGHT_TENANT_RUC, PLAYWRIGHT_LOGIN_EMAIL, PLAYWRIGHT_LOGIN_PASSWORD and PLAYWRIGHT_SUBSIDIARY',
  );
}

export function requireWorkstationCode(test: {
  skip: (condition: boolean, description: string) => void;
}) {
  test.skip(
    !hasWorkstationCode(),
    'Requires PLAYWRIGHT_WORKSTATION_CODE for Workstation mode',
  );
}

export function requireTenantRuc(test: {
  skip: (condition: boolean, description: string) => void;
}) {
  test.skip(!hasTenantRuc(), 'Requires PLAYWRIGHT_TENANT_RUC');
}

export function requireSubsidiary(test: {
  skip: (condition: boolean, description: string) => void;
}) {
  test.skip(!hasSubsidiary(), 'Requires PLAYWRIGHT_SUBSIDIARY');
}

export const posCleanupConfig = {
  url: env('PLAYWRIGHT_POS_URL', 'https://1792780241001.wanqara.org'),
  email: env('PLAYWRIGHT_RESTAURANT_EMAIL'),
  password: env('PLAYWRIGHT_RESTAURANT_PASSWORD'),
};