import { test as base, expect } from "@playwright/test";
import { runEnvSetupFlow } from "../helpers/env/env-setup-flow.js";
import { SessionInitializer } from "../helpers/factories/session-initializer.js";
import { handleCashRegisterState } from "../../regression/POS/harness/cash-register/cash-register-helpers.js";
import { withSessionWatchdog } from "../helpers/auth/auth.js";
import { getChefSessionPath, ensureChefAuthenticated } from "../helpers/auth/chef-auth.js";
import { chefHarness } from "../config/settings.js";
import { closeAllActiveOrders, createChefOrder, openAndSelectOrder } from "../../regression/POS/POS-R/harness/pos-orders-common.js";

const grantSetupHeadroom = (testInfo, ms) => testInfo.setTimeout(testInfo.timeout + ms);

export const test = base.extend({
  // Opciones para POS
  subsidiaryName: ["", { option: true }],
  subsidiaryCode: ["", { option: true }],
  openingAmount: ["", { option: true }],
  authType: ["", { option: true }],
  loginMode: ["", { option: true }],
  dispatchEnabled: [false, { option: true }],
  cashRegisterMode: ["", { option: true }],

  // Opciones para Chef
  chefAuthType: ["", { option: true }],
  chefLogin: ["", { option: true }],
  chefSubsidiary: ["", { option: true }],
  chefSubsidiaryCode: ["", { option: true }],

  // Opción para auto-setup de ordenes
  stageSetupOptions: [null, { option: true }],

  stageEnvironment: async ({ page, subsidiaryName, subsidiaryCode, openingAmount, authType, loginMode, dispatchEnabled, cashRegisterMode }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 120_000);

    if (!subsidiaryName) throw new Error("page fixture requires subsidiaryName option");
    if (!openingAmount) throw new Error("page fixture requires openingAmount option");
    if (!authType) throw new Error("page fixture requires authType option");

    // 1. Configuración de POS
    const posScenario = { authType, loginMode, subsidiaryName, subsidiaryCode };
    await SessionInitializer.setup(page, posScenario, { targetPath: "/admin/home" });

    // En Stage forzamos que el businessType sea Restaurante
    await runEnvSetupFlow(page, { authType, businessType: "Restaurante", dispatchEnabled, subsidiaryName, subsidiaryCode });
    await handleCashRegisterState(page, cashRegisterMode, openingAmount, subsidiaryName, subsidiaryCode, "/pos/restaurant-home");

    const homeIndicator = page.getByText(/Cliente:/i).first();
    const closedIndicator = page.getByRole("button", { name: /Abrir Caja/i }).first();
    const targetIndicator = cashRegisterMode === "ensure-closed" ? closedIndicator : homeIndicator;

    // Aserciones extraídas de la fixture para no contaminar reportes de setup
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
    let chefContext = null;

    if (chefAuthType) {
      // Limpieza Obligatoria de mesas previas antes de hacer nada con el chef
      await closeAllActiveOrders(page, subsidiaryName, "Limpieza automática workflow");

      chefContext = await browser.newContext({ storageState: getChefSessionPath(chefAuthType) });
      chefContext = await chefContext.newPage();
      
      await ensureChefAuthenticated(chefContext, {
        chefBaseUrl: chefHarness.baseUrl,
        targetPath: "/tables",
        login: chefLogin,
        subsidiary: chefSubsidiary,
        subsidiaryCode: chefSubsidiaryCode,
        chefAuthType
      });

      // Auto-preparación de orden si el test lo pide
      if (stageSetupOptions?.createOrder) {
        const orderOpts = stageSetupOptions.createOrder === true ? stageSetupOptions : stageSetupOptions.createOrder;
        const activeTableName = await createChefOrder(chefContext, {
           productName: orderOpts.productName,
           quantity: orderOpts.quantity || 1,
           chefLogin,
           chefSubsidiary,
           chefSubsidiaryCode,
           extras: orderOpts.extras
        });
        
        // Regresamos al POS y abrimos la orden recién creada para dejarla en bandeja de plata al test
        await openAndSelectOrder(page, activeTableName);
      }
      
      await use(chefContext);
      await chefContext.close();
    } else {
      await use(null);
    }
  }, { auto: true }]
});

export { expect };
