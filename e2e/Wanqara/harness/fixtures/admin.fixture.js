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

    // Construir el contexto de la sesión (cached o fresh) y navegar al targetPath
    await SessionInitializer.setup(page, scenario, { targetPath });

    // En el Admin, el indicador principal suele ser el drawer de módulos o el menú lateral.
    const adminMenuIndicator = page.locator(".v-navigation-drawer, .v-app-bar").first();

    // Aserciones extraídas de la fixture para no contaminar reportes de setup
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
