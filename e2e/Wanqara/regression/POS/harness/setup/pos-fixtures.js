import { test as base, expect } from "@playwright/test";
import { getTenantBaseUrl, playwrightHarness } from "../../../../harness/config/settings.js";
import { ensureAuthenticated, withSessionWatchdog } from "../../../../harness/helpers/auth/auth.js";
import { ensureCashRegisterOpen } from "../cash-register/cash-register-helpers.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  subsidiaryName: ["", { option: true }],
  openingAmount: [playwrightHarness.defaults.openingAmount, { option: true }],

  posPage: async ({ page, subsidiaryName, openingAmount }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 30_000);
    const tenantBaseUrl = getTenantBaseUrl();
    
    if (!subsidiaryName) throw new Error("posPage fixture requires subsidiaryName option to be set via test.use()");

    await ensureAuthenticated(page, { 
      tenantBaseUrl, 
      targetPath: "/pos/home", 
      authType: "retail" 
    });
    
    await ensureCashRegisterOpen(page, tenantBaseUrl, openingAmount, subsidiaryName, "retail");
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 15_000 }),
      "retail"
    );
    
    await use(page);
  },

  posRestaurantPage: async ({ page, subsidiaryName, openingAmount }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 90_000);
    const tenantBaseUrl = getTenantBaseUrl();
    
    if (!subsidiaryName) throw new Error("posRestaurantPage fixture requires subsidiaryName option to be set via test.use()");

    await ensureAuthenticated(page, { 
      tenantBaseUrl, 
      targetPath: "/pos/restaurant-home", 
      authType: "restaurant" 
    });
    
    await ensureCashRegisterOpen(page, tenantBaseUrl, openingAmount, subsidiaryName, "restaurant");
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 60_000 }),
      "restaurant"
    );
    
    await use(page);
  },
});

export { expect };
