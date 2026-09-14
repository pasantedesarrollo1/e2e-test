import { expect, test } from "@playwright/test";
import { ensureAuthenticated, withSessionWatchdog } from "../../../harness/helpers/auth/auth.js";

export async function smokeGo(page, tenantBaseUrl, path, authType = "retail") {
  await ensureAuthenticated(page, { tenantBaseUrl, targetPath: path, authType });
  await expect(page).not.toHaveURL(/\/error(\/|$)/);
}

export function generateSmokeTests(tenantBaseUrl, routes, authType = "retail") {
  for (const { path, assert } of routes) {
    test(`GET ${path}`, async ({ page }) => {
      await smokeGo(page, tenantBaseUrl, path, authType);
      if (assert) await withSessionWatchdog(page, () => assert(page), authType);
    });
  }
}
