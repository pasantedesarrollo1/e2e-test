import { test as base, expect } from "@playwright/test";
import { getTenantBaseUrl } from "../../../harness/settings.js";
import { ensureAuthenticated, withSessionWatchdog } from "../../../harness/auth.js";
import { ensureCashRegisterOpen } from "./cash-register-helpers.js";
import { SEED } from "../../../harness/seed.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  posPage: async ({ page }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 30_000);

    const tenantBaseUrl = getTenantBaseUrl();
    
    await ensureAuthenticated(page, { 
      tenantBaseUrl, 
      targetPath: "/pos/home", 
      authType: "retail" 
    });
    
    await page.waitForURL(/\/pos\/(home|open-cash-register)/);
    
    if (page.url().includes('open-cash-register')) {
      await ensureCashRegisterOpen(page, tenantBaseUrl, "10", SEED.subsidiaries.retail.name);
    }

    await page.waitForURL(/\/pos\/home/);
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i)).toBeVisible(),
      "retail"
    );
    
    await use(page);
  },

  posRestaurantPage: async ({ page }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 90_000);

    const tenantBaseUrl = getTenantBaseUrl();
    
    await ensureAuthenticated(page, { 
      tenantBaseUrl, 
      targetPath: "/pos/restaurant-home", 
      authType: "restaurant" 
    });
    
    await page.waitForURL(/\/pos/);
    await page.waitForURL(/\/pos\/(restaurant-home|open-cash-register)/);
    
    if (page.url().includes('open-cash-register')) {
      await ensureCashRegisterOpen(page, tenantBaseUrl, "10", SEED.subsidiaries.restaurant.name);
    }

    await page.waitForURL(/\/pos\/restaurant-home/);
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i)).toBeVisible({ timeout: 60_000 }),
      "restaurant"
    );
    
    await use(page);
  },
});

export { expect };