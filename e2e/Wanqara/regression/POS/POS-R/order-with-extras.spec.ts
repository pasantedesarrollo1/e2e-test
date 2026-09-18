import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/stage.fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "@/e2e/Wanqara/harness/helpers/reporting/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtrasData {
  baseProduct: string;
  categoryName: string;
  sinStockExtra: string;
  conStockExtra: string;
  outOfStockLabelText: string;
}

interface ScenarioData {
  description: string;
  openingAmount: string;
  authType: string;
  loginMode: 'fresh' | 'cached' | '';
  subsidiaryName: string;
  subsidiaryCode: string;
  chefAuthType?: string;
  chefLogin?: Record<string, unknown>;
  chefSubsidiary?: string;
  chefSubsidiaryCode?: string;
  extrasData: ExtrasData;
  clientCedula: string;
  paymentMethod: string;
  metadata?: { testScope?: string; ws?: string; [key: string]: unknown };
}

const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "order-with-extras.json"), "utf-8"))
);

import { searchAndSelectProduct, selectTable, submitOrder } from "./harness/chef-orders-flow.js";
import {
  addInStockExtra,
  confirmExtrasAndAddToCart,
  openExtrasSelection,
  validateOutOfStockExtra
} from "./harness/pos-extras-helpers.js";
import {
  collectOrder,
  finalizeSaleWithPayment,
  openAndSelectOrder
} from "./harness/pos-orders-common.js";


for (const scenario of scenarios) {
  test.describe.serial(`Restaurant POS ${scenario.description} - Order with Extras @${scenario.metadata?.testScope || 'regression'}`, () => {
    
    test.use({ 
      openingAmount: scenario.openingAmount, 
      authType: scenario.authType, 
      loginMode: scenario.loginMode,
      subsidiaryName: scenario.subsidiaryName,
      subsidiaryCode: scenario.subsidiaryCode,
      chefAuthType: scenario.chefAuthType,
      chefLogin: scenario.chefLogin,
      chefSubsidiary: scenario.chefSubsidiary,
      chefSubsidiaryCode: scenario.chefSubsidiaryCode
    });

    const baseProduct = scenario.extrasData.baseProduct;
    const categoryName = scenario.extrasData.categoryName;
    const sinStockExtra = scenario.extrasData.sinStockExtra;
    const conStockExtra = scenario.extrasData.conStockExtra;
    const outOfStockLabelText = scenario.extrasData.outOfStockLabelText;

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    test.beforeEach(async ({ chefContext }) => {
      await expect(chefContext!).toHaveURL(/\/tables/);
      await expect(
        chefContext!.locator("ion-segment-button").filter({ hasText: "Todos" })
      ).toBeVisible();
    });

    test("creates an order with extras validating stock and completes the payment", async ({ stageEnvironment, chefContext }) => {
      const posPage = stageEnvironment.page;
      const chefPage = chefContext;
      test.setTimeout(180_000);
      
      let tableName: string = "";
      
      await test.step("Select table, product and open modifiers sheet", async () => {
        tableName = await selectTable(chefPage!);
        await searchAndSelectProduct(chefPage!, baseProduct);
        await openExtrasSelection(chefPage!, categoryName);
      });

      await test.step("Validate out-of-stock extra shows correct labels", async () => {
        await validateOutOfStockExtra(chefPage!, sinStockExtra, outOfStockLabelText);
      });

      await test.step("Add an in-stock extra and confirm order", async () => {
        await addInStockExtra(chefPage!, conStockExtra);
        await confirmExtrasAndAddToCart(chefPage!);
        await submitOrder(chefPage!);
      });
      
      await test.step("Open order in POS and process payment", async () => {
        await openAndSelectOrder(posPage, tableName);
        await collectOrder(posPage);
        await finalizeSaleWithPayment(posPage, scenario.clientCedula, scenario.paymentMethod);
      });
    });
  });
}
