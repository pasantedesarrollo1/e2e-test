
import { test } from "@playwright/test";

const AUTH_DEBUG = process.env.PLAYWRIGHT_AUTH_DEBUG === "1";

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
