import { expect, test } from "@playwright/test";
import { ensureAuthenticated, withSessionWatchdog } from "../../../harness/helpers/auth/auth.js";

export async function smokeGo(page, path, authType = "actor1") {
  await ensureAuthenticated(page, { targetPath: path, authType });
  await expect(page).not.toHaveURL(/\/error(\/|$)/);
}

export function generateSmokeTests(routes, authType = "actor1") {
  for (const { path, assert } of routes) {
    test(`GET ${path}`, async ({ page }) => {
      await smokeGo(page, path, authType);
      if (assert) await withSessionWatchdog(page, () => assert(page), authType);
    });
  }
}
