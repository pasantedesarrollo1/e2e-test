import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, requireChefCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { runReleasePosSaleFlow, finalizeValidatedRestaurantSale } from "../harness/pos-cross-sale-flow.js";
import { PosSaleBuilder } from "../../../harness/helpers/builders/pos-sale-builder.js";
import { createChefOrder, navigateToRestaurantPOS, openAndSelectOrder, closeAllActiveOrders } from "../POS-R/harness/pos-orders-common.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
          
          const venta = new PosSaleBuilder(page, tenantBaseUrl)
            .withDocumentType(scenario.saleParams.documentType)
            .withProduct(scenario.saleParams.productName)
            .withPaymentMethod(scenario.saleParams.paymentMethod)
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
          await closeAllActiveOrders(cleanupPage, tenantBaseUrl);
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

          await navigateToRestaurantPOS(page, tenantBaseUrl);
          await openAndSelectOrder(page, activeTableName);
          
          const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar pago/i }).first();
          await cobrarBtn.click();
          
          await finalizeValidatedRestaurantSale(page);
        });
      });
    }
  }
});
