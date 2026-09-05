// Contexto de origen: Ticket WS-981, TES-206 (ws-981-document-type.spec.js)
// Valida las restricciones dinámicas del tipo de documento al cambiar de sucursal en el flujo de Preventas.

import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/auth.js";
import { getElectronicInvoicingAuthType } from "../../../../harness/seed.js";
import { selectCheckout as selectCheckoutPreSales } from "../harness/admin-pre-sale-flow.js";
import {
  readSelectedDocumentType,
  getAvailableDocumentOptions
} from "../harness/admin-dynamic-documents-helpers.js";
import { switchAdminSubsidiary } from "../harness/admin-document-helpers.js";

const TICKET = {
  ws: 'WS-981',
  tes: 'TES-206',
  release: 'v7.9.1',
  summary: 'Reactive Document Type by Subsidiary - Pre-Sales',
  addedToRegression: '2026-09-04',
};

const tenantBaseUrl = getTenantBaseUrl();

test.describe("Admin Pre-Sales — Dynamic Document Types (WS-981) @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);
  
  test.use({ storageState: getSessionPath(getElectronicInvoicingAuthType()) });

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