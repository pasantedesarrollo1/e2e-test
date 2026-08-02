import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../../harness/settings.js";
import { SEED } from "../../../../harness/seed.js";
import {
  CARRIER_CASES,
  assignCarrier,
  fillInternalWaybillForm,
  fillVehiclePlate,
  fillAddressDetails,
  searchAndSelectShipmentProduct,
  fillShipmentAmount,
  submitWaybillAndVerify,
} from "../../../harness/waybill-flow.js";

test.describe("Waybills — Internal Waybill @regression", () => {
  requirePosCredentials(test);

  const tenantBaseUrl = getTenantBaseUrl();

  test("creates an internal waybill validating all carrier assignment methods", async ({ page }) => {
    test.setTimeout(180_000);

    await test.step("Fill in the waybill information (dates, warehouse, and checkout)", async () => {
      await fillInternalWaybillForm(page, {
        tenantBaseUrl,
        warehouseName: SEED.pos.warehouse,
        checkoutName: SEED.pos.checkout,
      });
    });

    await test.step("Enter the vehicle license plate", async () => {
      await fillVehiclePlate(page, SEED.waybills.vehiclePlate);
    });

    for (const { label, carrier } of CARRIER_CASES) {
      const isLast = carrier === CARRIER_CASES[CARRIER_CASES.length - 1].carrier;

      await test.step(`Assign the carrier using ${label}`, async () => {
        await assignCarrier(page, carrier);
        await expect(page.getByText(/Empleado Test 1.*Identificación:/i)).toBeVisible();
      });

      if (!isLast) {
        await test.step(`Clear carrier assignment after ${label}`, async () => {
          const clearBtn = page.locator(".tw-flex > .tw-flex.tw-gap-1")
            .getByRole("button")
            .last();
          await clearBtn.click();
          await expect(page.getByText(/Empleado Test 1.*Identificación:/i)).not.toBeVisible();
        });
      }
    }

    await test.step("Enter the delivery information", async () => {
      await fillAddressDetails(page, {
        address: SEED.waybills.address,
        reason: SEED.waybills.reason,
        route: SEED.waybills.route,
        destinationSubsidiary: SEED.waybills.destinationSubsidiary,
      });
    });

    await test.step("Search for and select the shipment product", async () => {
      await searchAndSelectShipmentProduct(page, SEED.products.estandar.name);
    });

    await test.step("Enter the shipment quantity", async () => {
      await fillShipmentAmount(page, SEED.waybills.shipmentAmountInternal);
    });

    await test.step("Save the waybill and verify the redirect", async () => {
      await submitWaybillAndVerify(page, { tenantBaseUrl });
    });
  });
});