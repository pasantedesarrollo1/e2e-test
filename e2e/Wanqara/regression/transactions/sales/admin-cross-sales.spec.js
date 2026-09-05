import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import { RELEASE_SEED } from "../../../harness/seeds/cross-sales-seed.js";
import { 
  selectCustomCheckout, 
  submitValidatedAdminTransaction, 
  selectCustomDocumentType,
  selectClientByCedula, 
  searchAndSelectProduct, 
  selectPaymentMethod 
} from "./harness/admin-cross-sale-flow.js";
import { switchAdminSubsidiary } from "./harness/admin-document-helpers.js";

const TICKET = {
  ws: 'WS-1004',
  tes: 'TES-213',
  release: 'v7.9.1',
  summary: 'Admin Cross Sales Anti-Cross Validation',
  addedToRegression: 'true',
};

const tenantBaseUrl = getTenantBaseUrl();

test.describe("Admin Sales — Anti-Cross Validation @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath("retail") });

  test("Dynamically switches branches and validates warehouses/checkouts in SALES", async ({ page }) => {
    test.setTimeout(300_000); 
    
    await page.goto(`${tenantBaseUrl}/admin/home`);
    await page.waitForURL(/\/admin\/home/);

    for (const sucursal of RELEASE_SEED.sucursales) {
      await test.step(`Switching UI context to branch: ${sucursal.name}`, async () => {
        await switchAdminSubsidiary(page, sucursal.name);
      });

      for (const combo of sucursal.combinations) {
        await test.step(`Administrative Sale in: ${combo.bodega} / ${combo.caja}`, async () => {
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

  test("Dynamically switches branches and validates warehouses/checkouts in PRESALES", async ({ page }) => {
    test.setTimeout(300_000);
    
    await page.goto(`${tenantBaseUrl}/admin/home`);
    await page.waitForURL(/\/admin\/home/);

    for (const sucursal of RELEASE_SEED.sucursales) {
      await test.step(`Switching UI context to branch: ${sucursal.name}`, async () => {
        await switchAdminSubsidiary(page, sucursal.name);
      });

      for (const combo of sucursal.combinations) {
        await test.step(`Presale in: ${combo.bodega} / ${combo.caja}`, async () => {
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