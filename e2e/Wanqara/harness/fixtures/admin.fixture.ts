import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { SessionInitializer } from "@/e2e/Wanqara/harness/helpers/factories/session-initializer.js";
import { withSessionWatchdog } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";

const grantSetupHeadroom = (testInfo: TestInfo, ms: number): void => testInfo.setTimeout(testInfo.timeout + ms);

export type AdminFixtures = {
  subsidiaryName: string;
  subsidiaryCode: string;
  authType: string;
  loginMode: "fresh" | "cached" | "";
  targetPath: string;
  adminApp: { page: Page; contextType: string };
};

export const test = base.extend<AdminFixtures>({
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  authType: ["", { option: true }],
  loginMode: ["", { option: true }],
  targetPath: ["/admin/home", { option: true }],

  adminApp: async ({ page, subsidiaryName, subsidiaryCode, authType, loginMode, targetPath }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 60_000);

    if (!authType) throw new Error("page fixture requires authType option");

    const scenario = { authType, loginMode: loginMode as "fresh" | "cached", subsidiaryName, subsidiaryCode };

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
