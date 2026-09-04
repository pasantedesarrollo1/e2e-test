import { test } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { getSessionPath } from "../../../../harness/auth.js";
import { SEED, getDynamicDocumentType } from "../../../../harness/seed.js";
import { runAdminPreSaleFlow } from "../harness/admin-pre-sale-flow.js";
import { cancelFirstSaleAndVerify } from "../harness/cancel-sale-flow.js";

const TICKET = {
  ws: 'WS-840',
  tes: 'TES-198',
  release: 'v7.9.1',
  summary: 'Cancel Pre-Sales — Admin',
  splitFrom: 'cancel-sales.spec.js',
  addedToRegression: null,
};

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("Cancel Pre-Sales (Admin) @regression", () => {
  annotateTicket(test, TICKET);
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