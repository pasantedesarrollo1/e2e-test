import { test as base, expect } from "@playwright/test";
import { runEnvSetupFlow } from "../helpers/env/env-setup-flow.js";
import { SessionContextBuilder } from "../helpers/builders/session-context-builder.js";
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

  stageSetup: async ({ browser, page, subsidiaryName, subsidiaryCode, openingAmount, authType, loginMode, dispatchEnabled, cashRegisterMode, chefAuthType, chefLogin, chefSubsidiary, chefSubsidiaryCode, stageSetupOptions }, use, testInfo) => {
    grantSetupHeadroom(testInfo, 120_000);

    if (!subsidiaryName) throw new Error("stagePages fixture requires subsidiaryName option");
    if (!openingAmount) throw new Error("stagePages fixture requires openingAmount option");
    if (!authType) throw new Error("stagePages fixture requires authType option");

    // 1. Configuración de POS
    const posScenario = { authType, loginMode, subsidiaryName, subsidiaryCode };
    await SessionContextBuilder.build(page, posScenario, { targetPath: "/admin/home" });

    // En Stage forzamos que el businessType sea Restaurante
    await runEnvSetupFlow(page, { authType, businessType: "Restaurante", dispatchEnabled, subsidiaryName, subsidiaryCode });
    await handleCashRegisterState(page, cashRegisterMode, openingAmount, subsidiaryName, subsidiaryCode, "/pos/restaurant-home");

    const homeIndicator = page.getByText(/Cliente:/i).first();
    const closedIndicator = page.getByRole("button", { name: /Abrir Caja/i }).first();
    const targetIndicator = cashRegisterMode === "ensure-closed" ? closedIndicator : homeIndicator;

    if (loginMode === "cached") {
      await withSessionWatchdog(page, () =>
        expect(targetIndicator).toBeVisible({ timeout: 60_000 }),
        authType
      );
    } else {
      await expect(targetIndicator).toBeVisible({ timeout: 15_000 });
    }

    // 2. Configuración y Limpieza Obligatoria de Chef
    let chefPage = null;
    let chefContext = null;

    if (chefAuthType) {
      // Limpieza Obligatoria de mesas previas antes de hacer nada con el chef
      await closeAllActiveOrders(page, subsidiaryName, "Limpieza automática builder");

      chefContext = await browser.newContext({ storageState: getChefSessionPath(chefAuthType) });
      chefPage = await chefContext.newPage();
      
      // GARANTÍA ARQUITECTÓNICA: Siempre entregamos el chefPage en la pantalla inicial de mesas, 
      // validando su autenticación, incluso si el test no pide auto-crear una orden.
      
      await ensureChefAuthenticated(chefPage, {
        chefBaseUrl: chefHarness.baseUrl,
        targetPath: "/tables",
        login: chefLogin,
        subsidiary: chefSubsidiary,
        subsidiaryCode: chefSubsidiaryCode,
        chefAuthType
      });

      // Auto-preparación de orden si el test lo pide
      if (stageSetupOptions?.createOrder) {
        const activeTableName = await createChefOrder(chefPage, {
           productName: stageSetupOptions.productName,
           quantity: stageSetupOptions.quantity || 1,
           chefLogin,
           chefSubsidiary,
           chefSubsidiaryCode,
           extras: stageSetupOptions.extras
        });
        
        // Regresamos al POS y abrimos la orden recién creada para dejarla en bandeja de plata al test
        await openAndSelectOrder(page, activeTableName);
      }
    }

    // 3. Entregar los contextos y los datos
    await use({ posPage: page, chefPage });

    // 4. Limpieza de contextos auxiliares
    if (chefContext) {
      await chefContext.close();
    }
  },

  posPage: async ({ stageSetup }, use) => {
    await use(stageSetup.posPage);
  },

  chefPage: async ({ stageSetup }, use) => {
    await use(stageSetup.chefPage);
  }
});

export { expect };
