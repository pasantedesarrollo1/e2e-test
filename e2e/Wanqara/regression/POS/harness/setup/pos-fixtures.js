import { test as base, expect } from "@playwright/test";
// removed unused import
import { withSessionWatchdog } from "../../../../harness/helpers/auth/auth.js";
import { SessionContextBuilder } from "../../../../harness/helpers/builders/session-context-builder.js";
import { ensureCashRegisterOpen } from "../cash-register/cash-register-helpers.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  openingAmount: ["", { option: true }],
  authType: ["", { option: true }],
  loginMode: ["", { option: true }],

  posPage: async ({ page, subsidiaryName, subsidiaryCode, openingAmount, authType, loginMode }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 30_000);
    
    if (!subsidiaryName) throw new Error("posPage fixture requires subsidiaryName option to be set via test.use()");
    if (!openingAmount) throw new Error("posPage fixture requires openingAmount option to be set via test.use() from JSON");
    if (!authType) throw new Error("posPage fixture requires authType option");

    const scenario = { authType, loginMode, subsidiaryName, subsidiaryCode };
    
    await SessionContextBuilder.build(page, scenario, { targetPath: "/pos/home" });
    
    await ensureCashRegisterOpen(page, openingAmount, subsidiaryName, subsidiaryCode, "/pos/home");
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 15_000 }),
      authType
    );
    
    await use(page);
  },

  posRestaurantPage: async ({ page, subsidiaryName, subsidiaryCode, openingAmount, authType, loginMode }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 90_000);
    
    if (!subsidiaryName) throw new Error("posRestaurantPage fixture requires subsidiaryName option to be set via test.use()");
    if (!openingAmount) throw new Error("posRestaurantPage fixture requires openingAmount option to be set via test.use() from JSON");
    if (!authType) throw new Error("posRestaurantPage fixture requires authType option");

    const scenario = { authType, loginMode, subsidiaryName, subsidiaryCode };
    
    await SessionContextBuilder.build(page, scenario, { targetPath: "/pos/restaurant-home" });
    
    await ensureCashRegisterOpen(page, openingAmount, subsidiaryName, subsidiaryCode, "/pos/restaurant-home");
    
    await withSessionWatchdog(page, () =>
      expect(page.getByText(/Cliente:/i).first()).toBeVisible({ timeout: 60_000 }),
      authType
    );
    
    await use(page);
  },
});

export { expect };
