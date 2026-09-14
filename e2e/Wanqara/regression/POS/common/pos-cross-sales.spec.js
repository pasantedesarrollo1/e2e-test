import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getTenantBaseUrl, requireChefCredentials, requirePosCredentials, playwrightHarness } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { PosSaleBuilder } from "../../../harness/helpers/builders/pos-sale-builder.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { expect } from "@playwright/test";
import { completePayment } from "../harness/payments/pos-payment.js";
import { ensureCashRegisterOpen } from "../harness/cash-register/cash-register-helpers.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { selectClientByCedula } from "../../../harness/helpers/people/client-helpers.js";
import { closeAllActiveOrders, createChefOrder, navigateToRestaurantPOS, openAndSelectOrder } from "../POS-R/harness/pos-orders-common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "pos-cross-sales.json"), "utf-8")
);

const tenantBaseUrl = getTenantBaseUrl();

test.describe("POS Cross Sales", () => {
  test.describe.configure({ mode: 'default' });

  for (const scenario of scenarios) {
    if (scenario.type === 'retail-sale') {
      test.describe(`Environment: ${scenario.environment} @${scenario.metadata.testScope}`, () => {
        requirePosCredentials(test);
        test.use({ storageState: getSessionPath(scenario.authType) });
        annotateTicket(test, scenario.metadata);

        test(scenario.description, async ({ page }) => {
          test.setTimeout(120_000);
          
          const deps = { ensureCashRegisterOpen, completePayment, searchAndSelectProduct };
          const venta = new PosSaleBuilder(page, tenantBaseUrl, scenario.subsidiaryName || playwrightHarness.subsidiaries.retail, deps)
            .withDocumentType(scenario.saleParams.documentType)
            .withProduct(scenario.saleParams.productName)
            .withPaymentMethod(scenario.saleParams.paymentMethod)
            .withPrintedTicket(scenario.saleParams.openDrawer)
            .andThen(async (p) => {
                const finalizarVentaButton = p.getByRole("button", { name: /Terminar Venta/i });
            });
            
          await venta.execute();
        });
      });
    } else if (scenario.type === 'restaurant-flow') {
      test.describe.serial(`Environment: ${scenario.environment} @${scenario.metadata.testScope}`, () => {
        requirePosCredentials(test);
        requireChefCredentials(test);
        test.use({ storageState: getSessionPath(scenario.authType) });

        annotateTicket(test, scenario.metadata);

        test.beforeAll(async ({ browser }) => {
          const context = await browser.newContext({ storageState: getSessionPath(scenario.authType) });
          const cleanupPage = await context.newPage();
          await closeAllActiveOrders(cleanupPage, tenantBaseUrl, scenario.subsidiaryName, scenario.cleanupReason);
          await context.close();
        });

        test(scenario.description, async ({ page, browser }) => {
          test.setTimeout(180_000);
          
          // Abrir una ventana separada para Chef para no destruir la sesión de POS
          const chefContext = await browser.newContext({ storageState: getSessionPath('chef') });
          const chefPage = await chefContext.newPage();
          
          const activeTableName = await createChefOrder(chefPage, { productName: scenario.chefOrderParams.productName });
          
          // Cerramos la ventana de Chef para volver al flujo de POS limpio
          await chefContext.close();

          await navigateToRestaurantPOS(page, tenantBaseUrl, scenario.subsidiaryName);
          await openAndSelectOrder(page, activeTableName);
          
          const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar pago/i }).first();
          await cobrarBtn.click();
          
          await selectClientByCedula(page, scenario.chefOrderParams.clientCedula);
          
          await page.getByRole("button", { name: /Terminar Venta/i }).click();
          await page.waitForURL(/\/pos\/restaurant-payments/);

          const response = await completePayment(page, {
            paymentMethod: scenario.paymentMethod,
            printTicket: scenario.chefOrderParams.printTicket ?? false,
            openDrawer: scenario.chefOrderParams.openDrawer ?? false
          });

          const payload = response.request().postDataJSON();
          expect(payload.subsidiary).toBeDefined();
          
          if (payload.subsidiary?.open_cash_register?.checkout?.subsidiary_id) {
            expect(
              payload.subsidiary.id,
              `CROSSMATCH DETECTED IN POS: Subsidiary (${payload.subsidiary.id}) vs Cash Register (${payload.subsidiary.open_cash_register.checkout.subsidiary_id})`
            ).toBe(payload.subsidiary.open_cash_register.checkout.subsidiary_id);
          }
        });
      });
    }
  }
});
