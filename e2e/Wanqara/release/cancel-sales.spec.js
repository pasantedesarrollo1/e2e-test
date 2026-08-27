import { test } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../harness/auth.js";
import { SEED, getDynamicDocumentType } from "../harness/seed.js";
import { runAdminSaleFlow } from "../regression/transactions/sales/harness/admin-sale-flow.js";
import { runAdminPreSaleFlow } from "../regression/transactions/sales/harness/admin-pre-sale-flow.js";
import { runPosSaleFlow, selectClientByCedula } from "../regression/POS/harness/pos-sale-flow.js";
import { cancelFirstSaleAndVerify } from "./herness/cancel-sale-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Normal Sales (Admin) @release", () => {
  test.skip(true, "Skipped in develop: Feature WS-840 belongs to an unmerged branch.");
  requirePosCredentials(test);

  test("Restaurant (No Dispatch) - Creates a normal sale and cancels it, verifying that the inventory switch is displayed", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const page = await context.newPage();

    await test.step("Create Normal Sale", async () => {
      await runAdminSaleFlow(page, {
        tenantBaseUrl,
        authType: "restaurant",
        documentType: getDynamicDocumentType("restaurant"),
        productName: SEED.products.estandar.name,
      });
    });

    await test.step("Cancel Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: true,
        expectMessage: false,
      });
    });

    await page.close();
  });

  test("Business (With Dispatch) - Creates a normal sale and cancels it, verifying that the message is displayed without the switch", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("dispatch") });
    const page = await context.newPage();

    await test.step("Create Normal Sale", async () => {
      await runAdminSaleFlow(page, {
        tenantBaseUrl,
        authType: "dispatch",
        documentType: getDynamicDocumentType("dispatch"),
        productName: SEED.products.estandar.name,
      });
    });

    await test.step("Cancel Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: false,
        expectMessage: true,
      });
    });

    await page.close();
  });
});

test.describe.serial("Cancel Pre-Sales (Admin) @release", () => {
  test.skip(true, "Skipped in develop: Feature WS-840 belongs to an unmerged branch.");
  requirePosCredentials(test);

  test("Restaurant (No Dispatch) - Creates a pre-sale and cancels it, verifying that the message is displayed without the switch", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("restaurant") });
    const page = await context.newPage();

    await test.step("Create Pre-Sale", async () => {
      await runAdminPreSaleFlow(page, {
        tenantBaseUrl,
        authType: "restaurant",
        documentType: getDynamicDocumentType("restaurant"),
        productName: SEED.products.estandar.name,
      });
    });

    await test.step("Cancel Pre-Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: false,
        expectMessage: true,
      });
    });

    await page.close();
  });

  test("Business (With Dispatch) - Creates a pre-sale and cancels it, verifying that the message is displayed without the switch", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("dispatch") });
    const page = await context.newPage();

    await test.step("Create Pre-Sale", async () => {
      await runAdminPreSaleFlow(page, {
        tenantBaseUrl,
        authType: "dispatch",
        documentType: getDynamicDocumentType("dispatch"),
        productName: SEED.products.estandar.name,
      });
    });

    await test.step("Cancel Pre-Sale and Verify Modal", async () => {
      await cancelFirstSaleAndVerify(page, {
        tenantBaseUrl,
        expectSwitch: false,
        expectMessage: true,
      });
    });

    await page.close();
  });
});

test.describe.serial("Cancel Sales (POS) @release", () => {
  test.skip(true, "Skipped in develop: Feature WS-840 belongs to an unmerged branch.");
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