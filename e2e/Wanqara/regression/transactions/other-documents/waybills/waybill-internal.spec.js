import { test, expect } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { 
  fillInternalWaybillForm, fillVehiclePlate, CARRIER_CASES, assignCarrier, 
  fillAddressDetails, searchAndSelectShipmentProduct, fillShipmentAmount, 
  submitWaybillAndVerify 
} from "./harness/waybill-helpers.js";

import scenarios from "./0-json-data/waybill-internal.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe.serial("Waybills - Internal Waybill", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Creates an internal waybill (focus)" : "Creates an internal waybill",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(180_000);

        await test.step("Fill in the waybill information (dates, warehouse, and checkout)", async () => {
          await fillInternalWaybillForm(page, {
            authType: scenario.authType,
            warehouseName: scenario.waybillData.warehouseName,
            checkoutName: scenario.waybillData.checkoutName});
        });

        await test.step("Enter the vehicle license plate", async () => {
          await fillVehiclePlate(page, scenario.waybillData.vehiclePlate);
        });

        if (!scenario.waybillData.isLongProductSale) {
          for (const { label, carrier } of CARRIER_CASES) {
            const isLast = carrier === CARRIER_CASES[CARRIER_CASES.length - 1].carrier;

            await test.step(`Assign the carrier using ${label}`, async () => {
              await assignCarrier(page, carrier, scenario.waybillData.carrierParams);
              await expect(page.getByText(/Empleado Test 1.*Identificaci.n:/i)).toBeVisible();
            });

            if (!isLast) {
              await test.step(`Clear carrier assignment after ${label}`, async () => {
                const clearBtn = page.locator(".tw-flex > .tw-flex.tw-gap-1")
                  .getByRole("button")
                  .last();
                await clearBtn.click();
                await expect(page.getByText(/Empleado Test 1.*Identificaci.n:/i)).not.toBeVisible();
              });
            }
          }
        } else {
           await test.step("Assign carrier", async () => {
             await assignCarrier(page, "cedula", scenario.waybillData.carrierParams);
           });
        }

        await test.step("Enter the delivery information", async () => {
          await fillAddressDetails(page, {
            address: scenario.waybillData.address,
            reason: scenario.waybillData.reason,
            route: scenario.waybillData.route,
            destinationSubsidiary: scenario.waybillData.destinationSubsidiary});
        });

        await test.step("Search for and select the shipment product", async () => {
          await searchAndSelectShipmentProduct(page, scenario.waybillData.productName);
        });

        await test.step("Enter the shipment quantity", async () => {
          await fillShipmentAmount(page, scenario.waybillData.shipmentAmountInternal);
        });

        await test.step("Save the waybill and verify the redirect", async () => {
          await submitWaybillAndVerify(page, );
        });
      }
    );
  });
});