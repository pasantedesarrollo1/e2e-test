/* eslint-disable */
import { expect, test } from "@playwright/test";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { selectClientByCedula } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { selectCheckout, searchAndSelectProduct, selectPaymentMethod, submitAdminSale } from "../../sales/harness/admin-checkout-helpers.js";
import { waitForFormDefaults } from "../../sales/harness/admin-dynamic-documents-helpers.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { 
  fillExternalWaybillForm, CARRIER_CASES, assignCarrier, fillVehiclePlate, 
  fillAddressDetails, selectFirstAvailableShipmentProductFromSale, 
  fillShipmentAmount, submitWaybillAndVerify 
} from "./harness/waybill-helpers.js";

import scenariosRaw from "./0-json-data/waybill-external.json" with { type: "json" };
const scenarios = scenariosRaw as unknown as ScenarioData[];
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

// @ts-ignore
import type { TransporterInfo } from './harness/waybill-helpers.js';
interface WaybillData {
  isLongProductSale?: boolean;
  checkoutName: string;
  saleParams?: any;
  vehiclePlate: string;
  carrierParams: TransporterInfo | any;
  address: string;
  reason: string;
  route: string;
  shipmentAmountExternal?: string;
}

interface ScenarioData extends ScenarioDefinition, TestMetadata {
  authType: string;
  waybillData: WaybillData;
}


test.describe.serial("Waybills - External Waybill", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
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
            await selectCheckout(page, { warehouseName: scenario.waybillData.checkoutName });
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
              await assignCarrier(page, carrier as any, scenario.waybillData.carrierParams);
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
          await fillShipmentAmount(page, scenario.waybillData.shipmentAmountExternal as string);
        });

        await test.step("Save the waybill and verify the redirect", async () => {
          await submitWaybillAndVerify(page, );
        });
      }
    );
  });
});
