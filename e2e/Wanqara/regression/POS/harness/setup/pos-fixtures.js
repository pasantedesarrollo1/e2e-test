import { test as base, expect } from "@playwright/test";
// removed unused import
import { ensureAuthenticated, withSessionWatchdog } from "../../../../harness/helpers/auth/auth.js";
import { ensureCashRegisterOpen } from "../cash-register/cash-register-helpers.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  openingAmount: ["", { option: true }],

  posPage: async ({ page, subsidiaryName, subsidiaryCode, openingAmount }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 30_000);
    
    if (!subsidiaryName) throw new Error("posPage fixture requires subsidiaryName option to be set via test.use()");
    if (!openingAmount) throw new Error("posPage fixture requires openingAmount option to be set via test.use() from JSON");

    await ensureAuthenticated(page, { 
      targetPath: "/pos/home", 
      authType: "retail" 
    });
    
    await ensureCashRegisterOpen(page, openingAmount, subsidiaryName, subsidiaryCode, "retail");
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 15_000 }),
      "retail"
    );
    
    await use(page);
  },

  posRestaurantPage: async ({ page, subsidiaryName, subsidiaryCode, openingAmount }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 90_000);
    
    if (!subsidiaryName) throw new Error("posRestaurantPage fixture requires subsidiaryName option to be set via test.use()");
    if (!openingAmount) throw new Error("posRestaurantPage fixture requires openingAmount option to be set via test.use() from JSON");

    await ensureAuthenticated(page, { 
      targetPath: "/pos/restaurant-home", 
      authType: "restaurant" 
    });
    
    await ensureCashRegisterOpen(page, openingAmount, subsidiaryName, subsidiaryCode, "restaurant");
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 60_000 }),
      "restaurant"
    );
    
    await use(page);
  },
});

export { expect };
