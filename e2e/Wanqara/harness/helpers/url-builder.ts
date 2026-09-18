const PRODUCTION_HOST_SUFFIXES = ["wanqara.app", "wanqara.net"] as const;
const SAFE_HOST_SUFFIXES = ["preview.wanqara.app", "wanqara.org", "localhost"] as const;

/**
 * Checks if a given hostname belongs to a production environment.
 * 
 * @param hostname - The hostname to evaluate
 * @returns True if the hostname is a production environment, false if it's safe (e.g. preview, localhost, or not matching production)
 */
export function isProductionHost(hostname: string | URL): boolean {
  const host = String(hostname).toLowerCase();
  
  if (SAFE_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) {
    return false;
  }
  return PRODUCTION_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
}

/**
 * Builds a safe URL for the target tenant.
 * Ensures the tests do not execute against a production environment.
 * 
 * @param baseDomain - The base URL or domain (e.g. 'preview.wanqara.app')
 * @param tenantRuc - The RUC identifier to use as a subdomain
 * @returns The fully constructed URL pointing to the tenant
 * @throws {Error} When URL or RUC is missing, or if resolving to a production host
 */
export function buildSafeTenantUrl(baseDomain: string | undefined | null, tenantRuc: string | undefined | null): string {
  if (!baseDomain) throw new Error("❌ PLAYWRIGHT_WANQARA_URL is not defined.");
  if (!tenantRuc) throw new Error("❌ PLAYWRIGHT_TENANT_RUC is not defined.");

  const hasProtocol = /^https?:\/\//.test(baseDomain);
  const rawUrl = hasProtocol ? baseDomain : `https://${baseDomain}`;
  const url = new URL(rawUrl);

  if (!hasProtocol) {
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    url.protocol = isLocal ? "http:" : "https:";
  }

  if (!url.hostname.startsWith(`${tenantRuc}.`)) {
    url.hostname = `${tenantRuc}.${url.hostname}`;
  }

  if (isProductionHost(url.hostname)) {
    throw new Error(
      `❌ DANGER: Attempting to run E2E tests against a PRODUCTION environment ("${url.hostname}"). ` +
      `Please point to a local or QA/preview environment in the .env file.`
    );
  }

  return url.toString().replace(/\/$/, "");
}
