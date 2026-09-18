import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { runEnvSetupFlow } from "@/e2e/Wanqara/harness/helpers/env/env-setup-flow.js";
import { SessionInitializer } from "@/e2e/Wanqara/harness/helpers/factories/session-initializer.js";
import { handleCashRegisterState } from "@/e2e/Wanqara/regression/POS/harness/cash-register/cash-register-helpers.js";
import { withSessionWatchdog } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { getChefSessionPath, ensureChefAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/chef-auth.js";
import { chefHarness, type ChefUserCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { closeAllActiveOrders, createChefOrder, openAndSelectOrder, type ChefOrderExtras } from "@/e2e/Wanqara/regression/POS/POS-R/harness/pos-orders-common.js";

const grantSetupHeadroom = (testInfo: TestInfo, ms: number): void => testInfo.setTimeout(testInfo.timeout + ms);

export interface StageSetupOrderOptions {
  productName: string;
  quantity?: number;
  extras?: ChefOrderExtras | null;
}

export interface StageSetupOptions {
  createOrder?: StageSetupOrderOptions;
}

export type StageFixtures = {
  subsidiaryName: string;
  subsidiaryCode: string;
  openingAmount: string;
  authType: string;
  loginMode: "fresh" | "cached" | "";
  dispatchEnabled: boolean;
  ebillingEnabled: boolean | undefined;
  cashRegisterMode: string;
  
  chefAuthType: string;
  chefLogin: ChefUserCredentials | undefined;
  chefSubsidiary: string;
  chefSubsidiaryCode: string;
  
  stageSetupOptions: StageSetupOptions | null;
  
  stageEnvironment: { page: Page; contextType: string };
  chefContext: Page | null;
};

export const test = base.extend<StageFixtures>({
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  openingAmount: ["", { option: true }],
  authType: ["", { option: true }],
  loginMode: ["", { option: true }],
  dispatchEnabled: [false, { option: true }],
  ebillingEnabled: [undefined, { option: true }],
  cashRegisterMode: ["", { option: true }],

  chefAuthType: ["", { option: true }],
  chefLogin: [undefined, { option: true }],
  chefSubsidiary: ["", { option: true }],
  chefSubsidiaryCode: ["", { option: true }],

  stageSetupOptions: [null, { option: true }],

  stageEnvironment: async ({ page, subsidiaryName, subsidiaryCode, openingAmount, authType, loginMode, dispatchEnabled, ebillingEnabled, cashRegisterMode }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 120_000);

    if (!subsidiaryName) throw new Error("page fixture requires subsidiaryName option");
    if (!openingAmount) throw new Error("page fixture requires openingAmount option");
    if (!authType) throw new Error("page fixture requires authType option");

    const posScenario = { authType, loginMode: loginMode as "fresh" | "cached", subsidiaryName, subsidiaryCode };
    await SessionInitializer.setup(page, posScenario, { targetPath: "/admin/home" });

    await runEnvSetupFlow(page, { authType, businessType: "Restaurante", dispatchEnabled, ebillingEnabled, subsidiaryName, subsidiaryCode });
    await handleCashRegisterState(page, cashRegisterMode, openingAmount, subsidiaryName, subsidiaryCode, "/pos/restaurant-home");

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

    await use({ page, contextType: "stage" });
  },

  chefContext: [async ({ browser, stageEnvironment, chefAuthType, chefLogin, chefSubsidiary, chefSubsidiaryCode, stageSetupOptions, subsidiaryName }, use) => {
    const { page } = stageEnvironment;
    let chefPage: Page | null = null;

    if (chefAuthType) {
      await closeAllActiveOrders(page, subsidiaryName, "Limpieza automática workflow");

      const chefBrowserContext = await browser.newContext({ storageState: getChefSessionPath(chefAuthType) });
      chefPage = await chefBrowserContext.newPage();
      
      await ensureChefAuthenticated(chefPage, {
        chefBaseUrl: chefHarness.baseUrl,
        targetPath: "/tables",
        login: chefLogin,
        subsidiary: chefSubsidiary,
        subsidiaryCode: chefSubsidiaryCode,
        chefAuthType
      });

      if (stageSetupOptions?.createOrder) {
        const orderOpts = stageSetupOptions.createOrder;
        
        const activeTableName = await createChefOrder(chefPage, {
           productName: orderOpts.productName,
           quantity: orderOpts.quantity || 1,
           chefLogin,
           chefSubsidiary,
           chefSubsidiaryCode,
           extras: orderOpts.extras
        });
        
        await openAndSelectOrder(page, activeTableName);
      }
      
      await use(chefPage);
      await chefPage.close();
    } else {
      await use(null);
    }
  }, { auto: true }]
});

export { expect };
