import { test, expect } from "@playwright/test";
import { ensureAuthenticated, withSessionWatchdog } from "../../harness/auth.js";

export async function smokeGo(page, tenantBaseUrl, path) {
  await ensureAuthenticated(page, { tenantBaseUrl, targetPath: path });
  await expect(page).not.toHaveURL(/\/error(\/|$)/);
}

export function generateSmokeTests(tenantBaseUrl, routes) {
  for (const { path, assert } of routes) {
    test(`GET ${path}`, async ({ page }) => {
      await smokeGo(page, tenantBaseUrl, path);
      if (assert) await withSessionWatchdog(page, () => assert(page));
    });
  }
}