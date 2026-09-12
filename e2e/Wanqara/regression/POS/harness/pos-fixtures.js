import { test as base, expect } from "@playwright/test";
import { getTenantBaseUrl } from "../../../harness/config/settings.js";
import { ensureAuthenticated, withSessionWatchdog } from "../../../harness/helpers/auth.js";
import { ensureCashRegisterOpen } from "./cash-register-helpers.js";
import { SEED } from "../../../harness/config/seed.js";

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
    
    await ensureCashRegisterOpen(page, tenantBaseUrl, "10", SEED.subsidiaries.retail.name);
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 15_000 }),
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
    
    await ensureCashRegisterOpen(page, tenantBaseUrl, "10", SEED.subsidiaries.restaurant.name);
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 60_000 }),
      "restaurant"
    );
    
    await use(page);
  },
});

export { expect };
