export function buildTenantBaseUrl(baseUrl, tenantRuc) {
  const url = new URL(baseUrl);
  const hostname = url.hostname.toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    url.hostname = `${tenantRuc}.localhost`;

    return url.toString().replace(/\/$/, "");
  }

  const parts = hostname.split(".");
  if (parts.length >= 2) {
    url.hostname = `${tenantRuc}.${parts.slice(1).join(".")}`;

    return url.toString().replace(/\/$/, "");
  }

  url.hostname = `${tenantRuc}.${hostname}`;

  return url.toString().replace(/\/$/, "");
}

export function withPath(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

const PRODUCTION_HOST_SUFFIXES = ["wanqara.app", "wanqara.net"];
const NON_PRODUCTION_HOST_SUFFIXES = ["preview.wanqara.app",];

function matchesSuffix(hostname, suffix) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

export function isProductionHost(hostname) {
  const host = String(hostname).toLowerCase();

  if (NON_PRODUCTION_HOST_SUFFIXES.some((suffix) => matchesSuffix(host, suffix))) {
    return false;
  }

  return PRODUCTION_HOST_SUFFIXES.some((suffix) => matchesSuffix(host, suffix));
}

export function assertNonProductionBaseUrl(baseUrl) {
  let hostname;
  try {
    hostname = new URL(baseUrl).hostname;
  } catch {
    throw new Error(`PLAYWRIGHT_BASE_URL is not a valid URL: "${baseUrl}"`);
  }

  if (isProductionHost(hostname)) {
    throw new Error(
      `Refusing to run Playwright against production host "${hostname}". ` +
        `Point PLAYWRIGHT_BASE_URL at a local or preview environment.`,
    );
  }

  return baseUrl;
}
