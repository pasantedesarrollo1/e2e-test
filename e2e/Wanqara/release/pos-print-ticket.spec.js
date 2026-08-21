import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../harness/auth.js";
import { SEED } from "../harness/seed.js";
import { runPosSaleFlow } from "../regression/POS/harness/pos-sale-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe.serial("POS Sales - Print Ticket Validation @release", () => {
  requirePosCredentials(test);

  test("Retail (100) - Creates a POS sale with ticket printing enabled and verifies the notification", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("retail") });
    const page = await context.newPage();

    await test.step("Create POS Sale with Print Ticket enabled", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home", authType: "retail" });
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: SEED.products.estandar.name,
        skipNavigation: true,
        printTicket: true,
      });
    });

    await test.step("Verify 'Comprobante Impreso' notification", async () => {
      await expect(
        page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
      ).toBeVisible({ timeout: 15000 });
    });

    await page.close();
  });

  test("Dispatch (101) - Creates a POS sale with ticket printing enabled and verifies the notification", async ({ browser }) => {
    test.setTimeout(180_000);
    const context = await browser.newContext({ storageState: getSessionPath("dispatch") });
    const page = await context.newPage();

    await test.step("Create POS Sale with Print Ticket enabled", async () => {
      await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home", authType: "dispatch" });
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        productName: SEED.products.estandar.name,
        skipNavigation: true,
        printTicket: true,
      });
    });

    await test.step("Verify 'Comprobante Impreso' notification", async () => {
      await expect(
        page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
      ).toBeVisible({ timeout: 15000 });
    });

    await page.close();
  });
});