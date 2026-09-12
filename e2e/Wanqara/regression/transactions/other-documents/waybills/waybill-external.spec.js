import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath } from "../../../../harness/helpers/auth.js";
import { runAdminSaleFlow } from "../../sales/harness/admin-sale-flow.js";
import {
  CARRIER_CASES,
  assignCarrier,
  fillExternalWaybillForm,
  fillVehiclePlate,
  fillAddressDetails,
  selectFirstAvailableShipmentProductFromSale,
  fillShipmentAmount,
  submitWaybillAndVerify,
} from "./harness/waybill-helpers.js";

import scenarios from "./0-json-data/waybill-external.json" assert { type: "json" };

test.describe.serial("Waybills - External Waybill", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(
        scenario.only ? "Creates an external waybill (focus)" : "Creates an external waybill",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(240_000);
          const tenantBaseUrl = getTenantBaseUrl();

          if (scenario.waybillData.isLongProductSale) {
            await test.step("Create a sale with electronic invoice and the long product", async () => {
              await runAdminSaleFlow(page, {
                tenantBaseUrl,
                authType: scenario.authType,
                documentType: scenario.waybillData.saleParams.documentType,
                clientCedula: scenario.waybillData.saleParams.clientCedula,
                productName: scenario.waybillData.saleParams.productName,
              });
            });
          }

          await test.step("Fill external waybill form using the sale", async () => {
            await fillExternalWaybillForm(page, {
              tenantBaseUrl,
              checkoutName: scenario.waybillData.checkoutName,
              saleIndex: 0,
            });
          });

          await test.step("Enter the vehicle license plate", async () => {
            await fillVehiclePlate(page, scenario.waybillData.vehiclePlate);
          });

          if (!scenario.waybillData.isLongProductSale) {
            for (const { label, carrier } of CARRIER_CASES) {
              const isLast = carrier === CARRIER_CASES[CARRIER_CASES.length - 1].carrier;

              await test.step(`Assign the carrier using ${label}`, async () => {
                await assignCarrier(page, carrier);
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
               await assignCarrier(page, "cedula");
             });
          }

          await test.step("Enter the delivery information", async () => {
            await fillAddressDetails(page, {
              address: scenario.waybillData.address,
              reason: scenario.waybillData.reason,
              route: scenario.waybillData.route,
            });
          });

          await test.step("Select the first available product from the sale", async () => {
            await selectFirstAvailableShipmentProductFromSale(page);
          });

          await test.step("Enter the shipment quantity", async () => {
            await fillShipmentAmount(page, scenario.waybillData.shipmentAmountExternal);
          });

          await test.step("Save the waybill and verify the redirect", async () => {
            await submitWaybillAndVerify(page, { tenantBaseUrl });
          });
        }
      );
    });
  }
});