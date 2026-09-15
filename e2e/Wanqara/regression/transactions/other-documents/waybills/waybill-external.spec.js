import { expect, test } from "@playwright/test";
import { requirePosCredentials } from "../../../../harness/config/settings.js";
import { selectClientByCedula } from "../../../../harness/helpers/people/client-helpers.js";
import { selectCheckout, searchAndSelectProduct, selectPaymentMethod, submitAdminSale } from "../../sales/harness/admin-checkout-helpers.js";
import { waitForFormDefaults } from "../../sales/harness/admin-dynamic-documents-helpers.js";
import { ensureAuthenticated } from "../../../../harness/helpers/auth/auth.js";
import {
  CARRIER_CASES,
  assignCarrier,
  fillAddressDetails,
  fillExternalWaybillForm,
  fillShipmentAmount,
  fillVehiclePlate,
  selectFirstAvailableShipmentProductFromSale,
  submitWaybillAndVerify} from "./harness/waybill-helpers.js";

import scenarios from "./0-json-data/waybill-external.json" with { type: "json" };
import { generateDataDrivenTests } from "../../../../harness/helpers/test-generator.js";

test.describe.serial("Waybills - External Waybill", () => {
  generateDataDrivenTests(test, scenarios, (scenario) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Creates an external waybill (focus)" : "Creates an external waybill",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(240_000);

        if (scenario.waybillData.isLongProductSale) {
          await test.step("Create a sale with electronic invoice and the long product", async () => {
            await ensureAuthenticated(page, { targetPath: "/admin/ventas/add", authType: scenario.authType });
            await page.waitForURL(/\/admin\/ventas\/add/);
            await waitForFormDefaults(page);
            await selectCheckout(page, { checkoutName: scenario.waybillData.checkoutName });
            await selectClientByCedula(page, scenario.waybillData.saleParams.clientCedula);
            await searchAndSelectProduct(page, { name: scenario.waybillData.saleParams.productName });
            await selectPaymentMethod(page, scenario.waybillData.saleParams.paymentMethod);
            await submitAdminSale(page);
          });
        }

        await test.step("Fill external waybill form using the sale", async () => {
          await fillExternalWaybillForm(page, {
            authType: scenario.authType,
            checkoutName: scenario.waybillData.checkoutName,
            saleIndex: 0});
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
            route: scenario.waybillData.route});
        });

        await test.step("Select the first available product from the sale", async () => {
          await selectFirstAvailableShipmentProductFromSale(page);
        });

        await test.step("Enter the shipment quantity", async () => {
          await fillShipmentAmount(page, scenario.waybillData.shipmentAmountExternal);
        });

        await test.step("Save the waybill and verify the redirect", async () => {
          await submitWaybillAndVerify(page, );
        });
      }
    );
  });
});