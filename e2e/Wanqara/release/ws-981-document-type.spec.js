import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../harness/auth.js";
import { getElectronicInvoicingAuthType } from "../harness/seed.js";
import { selectCheckout as selectCheckoutSales } from "../regression/transactions/sales/harness/admin-sale-flow.js";
import { selectCheckout as selectCheckoutPreSales } from "../regression/transactions/sales/harness/admin-pre-sale-flow.js";
import {
  readSelectedDocumentType,
  getAvailableDocumentOptions,
  switchAdminSubsidiary
} from "./herness/ws-981-helpers.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("WS-981: Reactive Document Type by Subsidiary @release", () => {
  requirePosCredentials(test);
  
  test.use({ storageState: getSessionPath(getElectronicInvoicingAuthType()) });

  test("validates dynamic document type restrictions when switching subsidiaries in Sales", async ({ page }) => {
    test.setTimeout(120_000);
    
    await test.step("Access the sales module with an electronic invoicing-enabled subsidiary (001)", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/ventas/add", authType: getElectronicInvoicingAuthType() });
      await selectCheckoutSales(page);
      
      const options = await getAvailableDocumentOptions(page);
      const hasElectronic = options.some(o => o.includes("Factura") || o.includes("01"));
      expect(hasElectronic).toBeTruthy();
    });

    await test.step("Switch dynamically to a subsidiary without electronic invoicing (100)", async () => {
      await switchAdminSubsidiary(page, "100");
      await selectCheckoutSales(page);
      
      const selected = await readSelectedDocumentType(page);
      expect(selected).toMatch(/Recibos/i);
      
      const options = await getAvailableDocumentOptions(page);
      const hasElectronic = options.some(o => o.includes("Factura") || o.includes("01"));
      expect(hasElectronic).toBeFalsy();
    });

    await test.step("Switch back to the electronic invoicing-enabled subsidiary (001)", async () => {
      await switchAdminSubsidiary(page, "001");
      await selectCheckoutSales(page);
      
      const options = await getAvailableDocumentOptions(page);
      const hasElectronic = options.some(o => o.includes("Factura") || o.includes("01"));
      expect(hasElectronic).toBeTruthy();
    });
  });

  test("validates dynamic document type restrictions when switching subsidiaries in Pre-sales", async ({ page }) => {
    test.setTimeout(120_000);
    
    await test.step("Access the pre-sales module with an electronic invoicing-enabled subsidiary (001)", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/admin/pre-sale/add", authType: getElectronicInvoicingAuthType() });
      await selectCheckoutPreSales(page);
      
      const options = await getAvailableDocumentOptions(page);
      const hasElectronic = options.some(o => o.includes("Factura") || o.includes("01"));
      expect(hasElectronic).toBeTruthy();
    });

    await test.step("Switch dynamically to a subsidiary without electronic invoicing (100)", async () => {
      await switchAdminSubsidiary(page, "100");
      await selectCheckoutPreSales(page);
      
      const selected = await readSelectedDocumentType(page);
      expect(selected).toMatch(/Recibos/i);
      
      const options = await getAvailableDocumentOptions(page);
      const hasElectronic = options.some(o => o.includes("Factura") || o.includes("01"));
      expect(hasElectronic).toBeFalsy();
    });
  });
});