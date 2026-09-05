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

const TEST_CASES = [
  {
    name: "Retail (100) - Creates a POS sale and cancels it, verifying that the inventory switch is displayed",
    authType: "retail",
    targetPath: "/pos/home",
    expectSwitch: true,
    expectMessage: false,
  },
  {
    name: "Dispatch (101) - Creates a POS sale and cancels it, verifying that the message is displayed without the switch",
    authType: "dispatch",
    targetPath: "/pos/home",
    expectSwitch: false,
    expectMessage: true,
  },
  {
    name: "Restaurant (102) - Creates a POS sale and cancels it, verifying that the message is displayed without the switch",
    authType: "restaurant",
    targetPath: "/pos/restaurant-home",
    expectSwitch: false,
    expectMessage: true,
  },
];

test.describe.serial("Cancel Sales (POS) @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  for (const { name, authType, targetPath, expectSwitch, expectMessage } of TEST_CASES) {
    test(name, async ({ browser }) => {
      test.setTimeout(180_000);
      const context = await browser.newContext({ storageState: getSessionPath(authType) });
      const page = await context.newPage();

      await test.step("Create POS Sale", async () => {
        await ensureAuthenticated(page, { 
          tenantBaseUrl, 
          targetPath, 
          authType 
        });
        
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
          expectSwitch,
          expectMessage,
        });
      });

      await page.close();
    });
  }
});