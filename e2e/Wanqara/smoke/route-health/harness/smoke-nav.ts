/* eslint-disable */
import { expect, type Page } from "@playwright/test";
import { ensureAuthenticated, withSessionWatchdog } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";

export interface SmokeRoute {
  path: string;
  assert?: (page: Page) => Promise<void>;
}

export async function smokeGo(page: Page, path: string, authType: string = "actor1") {
  await ensureAuthenticated(page, { targetPath: path, authType });
  await expect(page).not.toHaveURL(/\/error(\/|$)/);
}

export function generateSmokeTests(testFn: any, routes: SmokeRoute[], authType: string = "actor1") {
  for (const { path, assert } of routes) {
    testFn(`GET ${path}`, async ({ page }: any) => {
      await smokeGo(page, path, authType);
      if (assert) await withSessionWatchdog(page, () => assert(page), authType);
    });
  }
}
