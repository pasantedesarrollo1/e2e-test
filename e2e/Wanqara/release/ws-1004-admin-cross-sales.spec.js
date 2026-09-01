import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath } from "../harness/auth.js";
import { SEED } from "../harness/seed.js";
import { RELEASE_SEED } from "./herness/ws-1004-seed.js";
import { 
  selectCustomCheckout, 
  submitValidatedAdminTransaction, 
  switchSubsidiaryFromProfile,
  selectCustomDocumentType,
  selectClientByCedula, 
  searchAndSelectProduct, 
  selectPaymentMethod 
} from "./herness/ws-1004-admin-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("ws-1004-admin-cross-sales: Validación Anti-Cruce en Ventas Administrativas @release", () => {
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath("retail") });

  test("ws-1004-sale-combinations: Cambia dinámicamente de sucursales y valida bodegas/cajas en VENTAS", async ({ page }) => {
    test.setTimeout(300_000); 
    
    await page.goto(`${tenantBaseUrl}/admin/home`);
    await page.waitForURL(/\/admin\/home/);

    for (const sucursal of RELEASE_SEED.sucursales) {
      await test.step(`Cambiando contexto UI a la sucursal: ${sucursal.name}`, async () => {
        await switchSubsidiaryFromProfile(page, sucursal.name);
      });

      for (const combo of sucursal.combinations) {
        await test.step(`Venta Administrativa en: ${combo.bodega} / ${combo.caja}`, async () => {
          await page.goto(`${tenantBaseUrl}/admin/ventas/add`);
          await page.waitForURL(/\/admin\/ventas\/add/);

          await selectCustomCheckout(page, combo.bodega, combo.caja);
          await selectCustomDocumentType(page, SEED.documentTypes.recibos);
          await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);
          await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
          await selectPaymentMethod(page, SEED.paymentMethods.efectivo.label);

          await submitValidatedAdminTransaction(page, "/api/v2/billing/sales");
        });
      }
    }
  });

  test("ws-1004-presale-combinations: Cambia dinámicamente de sucursales y valida bodegas/cajas en PREVENTAS", async ({ page }) => {
    test.setTimeout(300_000);
    
    await page.goto(`${tenantBaseUrl}/admin/home`);
    await page.waitForURL(/\/admin\/home/);

    for (const sucursal of RELEASE_SEED.sucursales) {
      await test.step(`Cambiando contexto UI a la sucursal: ${sucursal.name}`, async () => {
        await switchSubsidiaryFromProfile(page, sucursal.name);
      });

      for (const combo of sucursal.combinations) {
        await test.step(`Preventa en: ${combo.bodega} / ${combo.caja}`, async () => {
          await page.goto(`${tenantBaseUrl}/admin/pre-sale/add`);
          await page.waitForURL(/\/admin\/pre-sale\/add/);

          await selectCustomCheckout(page, combo.bodega, combo.caja);
          await selectCustomDocumentType(page, SEED.documentTypes.recibos);
          await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);
          await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
          await selectPaymentMethod(page, SEED.paymentMethods.efectivo.label);

          await submitValidatedAdminTransaction(page, "/api/v2/billing/pre-sales");
        });
      }
    }
  });
});