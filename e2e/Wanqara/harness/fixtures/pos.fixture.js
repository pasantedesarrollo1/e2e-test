import { test as base, expect } from "@playwright/test";
import { runEnvSetupFlow } from "../helpers/env/env-setup-flow.js";
import { SessionInitializer } from "../helpers/factories/session-initializer.js";
import { handleCashRegisterState } from "../../regression/POS/harness/cash-register/cash-register-helpers.js";
import { withSessionWatchdog } from "../helpers/auth/auth.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  openingAmount: ["", { option: true }],
  authType: ["", { option: true }],
  loginMode: ["", { option: true }],
  businessType: ["", { option: true }],
  dispatchEnabled: [false, { option: true }],
  cashRegisterMode: ["", { option: true }],

  posEnvironment: async ({ page, subsidiaryName, subsidiaryCode, openingAmount, authType, loginMode, businessType, dispatchEnabled, cashRegisterMode }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 60_000);

    if (!subsidiaryName) throw new Error("page fixture requires subsidiaryName option");
    if (!openingAmount) throw new Error("page fixture requires openingAmount option");
    if (!authType) throw new Error("page fixture requires authType option");

    const scenario = { authType, loginMode, subsidiaryName, subsidiaryCode };

    await SessionInitializer.setup(page, scenario, { targetPath: "/admin/home" });

    if (businessType) {
      await runEnvSetupFlow(page, { authType, businessType, dispatchEnabled, subsidiaryName, subsidiaryCode });
    }

    const targetUrl = businessType === "Restaurante" ? "/pos/restaurant-home" : "/pos/home";
    await handleCashRegisterState(page, cashRegisterMode, openingAmount, subsidiaryName, subsidiaryCode, targetUrl);

    const homeIndicator = page.getByText(/Cliente:/i).first();
    const closedIndicator = page.getByRole("button", { name: /Abrir Caja/i }).first();
    const targetIndicator = cashRegisterMode === "ensure-closed" ? closedIndicator : homeIndicator;

    if (loginMode === "cached") {
      await withSessionWatchdog(page, async () => {
        await targetIndicator.waitFor({ state: "visible", timeout: 60_000 });
      }, authType);
    } else {
      await targetIndicator.waitFor({ state: "visible", timeout: 15_000 });
    }

    await use({ page, contextType: "pos" });
  }
});

export { expect };
