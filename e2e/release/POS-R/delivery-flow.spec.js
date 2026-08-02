import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import { navigateToRestaurantPOS } from "../harness/pos-orders-common.js";
import {
  DELIVERY_SEED,
  openDeliveryModal,
  selectDeliveryMode,
  ensureDeliveryPhoneAndAddress,
  fillDeliveryFormInfo,
  addClientFromDeliveryForm,
  fillDeliveryAddress,
  saveDeliveryForm,
  selectExistingDeliveryAddress,
  saveDeliverySelection,
  verifyDeliveryConfirmed,
} from "../harness/pos-delivery-flow.js";

test.describe("POS Restaurant — Delivery Flow @regression", () => {
  requirePosCredentials(test);

  test("creates or selects a delivery address depending on prior state", async ({ page }) => {
    test.info().annotations.push({
      type: "issue",
      description: "https://wanqara-team.atlassian.net/browse/WS-871",
    });
    test.info().annotations.push({
      type: "known_issue",
      description:
        "Si falla por timeout, puede deberse a que las búsquedas de números telefónicos y la asignación de clientes no son óptimas, generando lag en el sistema tras uso prolongado.",
    });

    test.setTimeout(180_000);

    const tenantBaseUrl = getTenantBaseUrl();

    await navigateToRestaurantPOS(page, tenantBaseUrl);

    const modal = await test.step("Open delivery modal", async () => {
      return await openDeliveryModal(page);
    });

    await test.step("Select delivery mode", async () => {
      await selectDeliveryMode(page, modal);
    });

    const { form, isNew } = await test.step("Ensure phone and detect address state", async () => {
      return await ensureDeliveryPhoneAndAddress(page, modal, DELIVERY_SEED.phone);
    });

    if (isNew) {
      await test.step("Fill delivery contact info", async () => {
        await fillDeliveryFormInfo(page, form, {
          clientName: DELIVERY_SEED.clientName,
          observation: DELIVERY_SEED.observation,
        });
      });

      await test.step("Add and save client from delivery form", async () => {
        await addClientFromDeliveryForm(page, form, {
          cedula: SEED.clients.consumidorFinal.cedula,
        });
      });

      await test.step("Fill address details", async () => {
        await fillDeliveryAddress(page, form, DELIVERY_SEED.address);
      });

      await test.step("Save new delivery and verify success", async () => {
        await saveDeliveryForm(page);
      });

      await test.step("Select the newly created address card", async () => {
        await selectExistingDeliveryAddress(page);
      });

      await test.step("Save delivery selection", async () => {
        await saveDeliverySelection(page);
      });
    } else {
      await test.step("Select existing address card", async () => {
        await selectExistingDeliveryAddress(page);
      });

      await test.step("Save delivery selection", async () => {
        await saveDeliverySelection(page);
      });
    }

    await test.step("Verify delivery confirmed in panel", async () => {
      await verifyDeliveryConfirmed(page);
    });
  });
});