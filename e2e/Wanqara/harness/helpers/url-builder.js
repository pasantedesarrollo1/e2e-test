const PRODUCTION_HOST_SUFFIXES = ["wanqara.app", "wanqara.net"];
const SAFE_HOST_SUFFIXES = ["preview.wanqara.app", "wanqara.org", "localhost"];

export function isProductionHost(hostname) {
  const host = String(hostname).toLowerCase();
  
  if (SAFE_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) {
    return false;
  }
  return PRODUCTION_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
}

export function buildSafeTenantUrl(baseDomain, tenantRuc) {
  if (!baseDomain) throw new Error("❌ PLAYWRIGHT_WANQARA_URL no está definido.");
  if (!tenantRuc) throw new Error("❌ PLAYWRIGHT_TENANT_RUC no está definido.");

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
      `❌ PELIGRO: Intentando ejecutar pruebas E2E contra un entorno de PRODUCCIÓN ("${url.hostname}"). ` +
      `Por favor, apunta a un entorno local o de QA/preview en el .env`
    );
  }

  return url.toString().replace(/\/$/, "");
}
