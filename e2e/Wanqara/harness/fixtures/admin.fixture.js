import { test as base, expect } from "@playwright/test";
import { SessionInitializer } from "../helpers/factories/session-initializer.js";
import { withSessionWatchdog } from "../helpers/auth/auth.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  authType: ["", { option: true }],
  loginMode: ["", { option: true }],
  targetPath: ["/admin/home", { option: true }],

  adminApp: async ({ page, subsidiaryName, subsidiaryCode, authType, loginMode, targetPath }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 60_000);

    if (!authType) throw new Error("page fixture requires authType option");

    const scenario = { authType, loginMode, subsidiaryName, subsidiaryCode };

    await SessionInitializer.setup(page, scenario, { targetPath });

    const adminMenuIndicator = page.locator(".v-navigation-drawer, .v-app-bar").first();

    if (loginMode === "cached") {
      await withSessionWatchdog(page, async () => {
        await adminMenuIndicator.waitFor({ state: "visible", timeout: 60_000 });
      }, authType);
    } else {
      await adminMenuIndicator.waitFor({ state: "visible", timeout: 15_000 });
    }

    await use({ page, contextType: "admin" });
  }
});

export { expect };
