import { test } from "@playwright/test";
import { requirePosCredentials, requireChefCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath } from "../harness/auth.js";
import { SEED } from "../harness/seed.js";
import { runReleasePosSaleFlow, finalizeValidatedRestaurantSale } from "./herness/ws-1004-pos-flow.js";
import { createChefOrder, navigateToRestaurantPOS, openAndSelectOrder, closeAllActiveOrders } from "../regression/POS/POS-R/harness/pos-orders-common.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("ws-1004-pos-sales: Ventas POS con Validación de Secuencial @release", () => {
  requirePosCredentials(test);

  test.describe("Comercios 100", () => {
    test.use({ storageState: getSessionPath("retail") });

    test("ws-1004-pos-retail: Venta POS en sucursal 100 con recibos", async ({ page }) => {
      test.setTimeout(120_000);
      await runReleasePosSaleFlow(page, tenantBaseUrl, SEED.documentTypes.recibos);
    });
  });

  test.describe("Comercios Dispatch 101", () => {
    test.use({ storageState: getSessionPath("dispatch") });

    test("ws-1004-pos-dispatch: Venta POS en sucursal 101 con recibos", async ({ page }) => {
      test.setTimeout(120_000);
      await runReleasePosSaleFlow(page, tenantBaseUrl, SEED.documentTypes.recibos);
    });
  });
});

test.describe.serial("ws-1004-pos-restaurant: Venta POS Restaurant con Factura Electrónica @release", () => {
  requirePosCredentials(test);
  requireChefCredentials(test);

  test.use({ storageState: getSessionPath("restaurant") });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const cleanupPage = await context.newPage();
    await closeAllActiveOrders(cleanupPage, tenantBaseUrl);
    await context.close();
  });

  test("ws-1004-pos-restaurant: Crea orden en Chef y la cobra verificando access_key", async ({ page }) => {
    test.setTimeout(180_000);
    
    // 1. Chef
    const activeTableName = await createChefOrder(page);

    // 2. POS
    await navigateToRestaurantPOS(page, tenantBaseUrl);
    await openAndSelectOrder(page, activeTableName);
    
    const cobrarBtn = page.getByRole("button", { name: /Cobrar/i }).filter({ hasText: /Procesar pago/i }).first();
    await cobrarBtn.click();
    
    // 3. Finalizar e interceptar (Usando Facturación Electrónica por defecto en config de seed)
    await finalizeValidatedRestaurantSale(page);
  });
});