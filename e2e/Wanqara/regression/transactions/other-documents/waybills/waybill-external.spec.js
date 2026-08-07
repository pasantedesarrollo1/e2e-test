import { test, expect } from "@playwright/test";
import {
  requirePosCredentials,
  getTenantBaseUrl,
} from "../../../../harness/settings.js";
import { SEED, getElectronicInvoicingAuthType } from "../../../../harness/seed.js";
import { getSessionPath } from "../../../../harness/auth.js";
import {
  CARRIER_CASES,
  assignCarrier,
  fillExternalWaybillForm,
  fillVehiclePlate,
  fillAddressDetails,
  selectFirstAvailableShipmentProductFromSale,
  fillShipmentAmount,
  submitWaybillAndVerify,
} from "./harness/waybill-flow.js";

test.describe("Waybills — External Waybill @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath(getElectronicInvoicingAuthType()) });

  const tenantBaseUrl = getTenantBaseUrl();

  test("creates an external waybill validating all carrier assignment methods", async ({ page }) => {
    test.setTimeout(180_000);

    await test.step("Fill in the waybill information (sale, dates, and checkout)", async () => {
      await fillExternalWaybillForm(page, {
        tenantBaseUrl,
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
      });
    });

    await test.step("Select the first available product from the sale", async () => {
      await selectFirstAvailableShipmentProductFromSale(page);
    });

    await test.step("Enter the shipment quantity", async () => {
      await fillShipmentAmount(page, SEED.waybills.shipmentAmountExternal);
    });

    await test.step("Save the waybill and verify the redirect", async () => {
      await submitWaybillAndVerify(page, { tenantBaseUrl });
    });
  });
});