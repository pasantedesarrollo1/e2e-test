/**
 * Opt-in tracing for the "logged out mid-run" failures. Enable with
 * PLAYWRIGHT_AUTH_DEBUG=1.
 *
 * The backend keeps one live token per user, so any successful POST to
 * /general/login revokes the token every other spec is holding and the next
 * request made with the old one comes back 401. That makes three facts worth
 * printing, in this order:
 *
 *   1. which token a page is actually carrying,
 *   2. who minted a new one (the revoker), and
 *   3. which request got the first 401 (the victim).
 *
 * Read the log for a NEW TOKEN line before the 401s — whatever test it names is
 * what revoked the session. If no NEW TOKEN line appears at all, nothing in
 * this run signed in, so the revoker is outside it: a concurrent CI job, or
 * somebody logged into the same account in a browser.
 */
import { test } from "@playwright/test";

const AUTH_DEBUG = process.env.PLAYWRIGHT_AUTH_DEBUG === "1";

// Pages are instrumented once; ensureAuthenticated runs per navigation.
const instrumented = new WeakSet();

const where = () => {
  try {
    return test.info().titlePath.slice(1).join(" › ");
  } catch {
    return "outside a test";
  }
};

export const tokenTail = (token) =>
  token ? `...${String(token).slice(-8)}` : "(no token)";

const isLoginCall = (url) => url.includes("/general/login");

export function instrumentAuth(page) {
  if (!AUTH_DEBUG || instrumented.has(page)) return;
  instrumented.add(page);

  page.on("request", (request) => {
    if (isLoginCall(request.url())) {
      console.log(`[auth] LOGIN sent — ${where()}`);
    }
  });

  page.on("response", (response) => {
    const url = response.url();

    if (isLoginCall(url) && response.ok()) {
      void response
        .json()
        .then((body) => {
          console.log(
            `[auth] NEW TOKEN ${tokenTail(body?.data?.token)} minted — ${where()} ` +
              `(this revokes the shared session)`,
          );
        })
        .catch(() => undefined);
      return;
    }

    if (response.status() === 401) {
      console.log(
        `[auth] 401 ${response.request().method()} ${url} — ${where()}`,
      );
    }
  });
}

/** Reads the token the app currently holds, straight out of the pinia store. */
export async function readActiveToken(page) {
  return page
    .evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("user-auth") ?? "{}").token;
      } catch {
        return undefined;
      }
    })
    .catch(() => undefined);
}

export async function logActiveToken(page, label) {
  if (!AUTH_DEBUG) return;
  console.log(`[auth] token ${tokenTail(await readActiveToken(page))} ${label} — ${where()}`);
}

export const authDebugEnabled = () => AUTH_DEBUG;
