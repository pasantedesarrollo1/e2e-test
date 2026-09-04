import { test } from "@playwright/test";
import { annotateTicket } from "../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";
import { runPosSaleFlow, selectClientByCedula } from "../harness/pos-sale-flow.js";
import { cancelFirstSaleAndVerify } from "../../transactions/sales/harness/cancel-sale-flow.js";

const TICKET = {
  ws: 'WS-840',
  tes: 'TES-198',
  release: 'v7.9.1',
  summary: 'Cancel Sales — POS',
  splitFrom: 'cancel-sales.spec.js',
  addedToRegression: null,
};

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Sales (POS) @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test("Retail (100) - Creates a POS sale and cancels it, verifying that the inventory switch is displayed", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("retail") });
    const page = await context.newPage();

    await test.step("Create POS Sale", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home", authType: "retail" });
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: SEED.products.estandar.name,
        skipNavigation: true,
        beforeFinish: async (p) => await selectClientByCedula(p, SEED.clients.consumidorFinal.cedula),
      });
    });

    await test.step("Cancel POS Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: true,
        expectMessage: false,
      });
    });

    await page.close();
  });

  test("Dispatch (101) - Creates a POS sale and cancels it, verifying that the message is displayed without the switch", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("dispatch") });
    const page = await context.newPage();

    await test.step("Create POS Sale", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home", authType: "dispatch" });
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: SEED.products.estandar.name,
        skipNavigation: true,
        beforeFinish: async (p) => await selectClientByCedula(p, SEED.clients.consumidorFinal.cedula),
      });
    });

    await test.step("Cancel POS Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: false,
        expectMessage: true,
      });
    });

    await page.close();
  });

  test("Restaurant (102) - Creates a POS sale and cancels it, verifying that the message is displayed without the switch", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const page = await context.newPage();

    await test.step("Create POS Sale", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/restaurant-home", authType: "restaurant" });
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: SEED.products.estandar.name,
        skipNavigation: true,
        beforeFinish: async (p) => await selectClientByCedula(p, SEED.clients.consumidorFinal.cedula),
      });
    });

    await test.step("Cancel POS Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: false,
        expectMessage: true,
      });
    });

    await page.close();
  });
});