import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath } from "../harness/auth.js";
import { SEED, getElectronicInvoicingAuthType } from "../harness/seed.js";
import { runAdminSaleFlow } from "../regression/transactions/sales/harness/admin-sale-flow.js";
import {
  assignCarrier,
  fillInternalWaybillForm,
  fillVehiclePlate,
  fillAddressDetails,
  searchAndSelectShipmentProduct,
  fillShipmentAmount,
  submitWaybillAndVerify,
  fillExternalWaybillForm,
  selectFirstAvailableShipmentProductFromSale
} from "../regression/transactions/other-documents/waybills/harness/waybill-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Waybills with Long Product Names @release", () => {
  requirePosCredentials(test);

  const authType = getElectronicInvoicingAuthType();
  test.use({ storageState: getSessionPath(authType) });

  test("Internal Waybill - Creates an internal waybill with a long product name", async ({ page }) => {
    test.setTimeout(180_000);

    await test.step("Fill internal waybill form", async () => {
      await fillInternalWaybillForm(page, {
        tenantBaseUrl,
        warehouseName: SEED.pos.warehouse,
        checkoutName: SEED.pos.checkout,
      });
    });

    await test.step("Enter vehicle plate and carrier", async () => {
      await fillVehiclePlate(page, SEED.waybills.vehiclePlate);
      await assignCarrier(page, "cedula"); 
    });

    await test.step("Enter delivery information", async () => {
      await fillAddressDetails(page, {
        address: SEED.waybills.address,
        reason: SEED.waybills.reason,
        route: SEED.waybills.route,
        destinationSubsidiary: SEED.waybills.destinationSubsidiary,
      });
    });

    await test.step("Search and select the long product name", async () => {
      await searchAndSelectShipmentProduct(page, SEED.products.estandarLargo.name);
    });

    await test.step("Enter shipment quantity", async () => {
      await fillShipmentAmount(page, SEED.waybills.shipmentAmountInternal);
    });

    await test.step("Save internal waybill and verify", async () => {
      await submitWaybillAndVerify(page, { tenantBaseUrl });
    });
  });

  test("External Waybill - Creates a sale and an external waybill with a long product name", async ({ page }) => {
    test.setTimeout(240_000);

    await test.step("Create a sale with electronic invoice and the long product", async () => {
      await runAdminSaleFlow(page, {
        tenantBaseUrl,
        authType,
        documentType: SEED.documentTypes.facturaElectronica,
        clientCedula: SEED.clients.test.cedula,
        productName: SEED.products.estandarLargo.name,
      });
    });

    await test.step("Fill external waybill form using the newly created sale", async () => {
      await fillExternalWaybillForm(page, {
        tenantBaseUrl,
        checkoutName: SEED.pos.checkout,
        saleIndex: 0, // Selects the most recent sale from the modal
      });
    });

    await test.step("Enter vehicle plate and carrier", async () => {
      await fillVehiclePlate(page, SEED.waybills.vehiclePlate);
      await assignCarrier(page, "cedula");
    });

    await test.step("Enter delivery information", async () => {
      await fillAddressDetails(page, {
        address: SEED.waybills.address,
        reason: SEED.waybills.reason,
        route: SEED.waybills.route,
      });
    });

    await test.step("Select the long product from the sale items", async () => {
      await selectFirstAvailableShipmentProductFromSale(page);
    });

    await test.step("Enter shipment quantity", async () => {
      await fillShipmentAmount(page, SEED.waybills.shipmentAmountExternal);
    });

    await test.step("Save external waybill and verify", async () => {
      await submitWaybillAndVerify(page, { tenantBaseUrl });
    });
  });
});