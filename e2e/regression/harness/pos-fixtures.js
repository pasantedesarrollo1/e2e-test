import { test as base, expect } from "@playwright/test";
import { getTenantBaseUrl } from "../../harness/settings.js";
import { ensureAuthenticated } from "../../harness/auth.js";

export const test = base.extend({
  posPage: async ({ page }, use) => {
    const tenantBaseUrl = getTenantBaseUrl();
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home" });
    await page.waitForURL(/\/pos\/home/);
    await expect(page.getByText(/Cliente:/i)).toBeVisible();
    await use(page);
  },

  posRestaurantPage: async ({ page }, use) => {
    const tenantBaseUrl = getTenantBaseUrl();
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/restaurant-home" });
    await page.waitForURL(/\/pos/);
    await expect(page.getByText(/Cliente:/i)).toBeVisible({ timeout: 60_000 });
    await use(page);
  },
});

export { expect };