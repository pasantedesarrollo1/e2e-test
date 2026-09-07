import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { SEED } from "../../../harness/seed.js";
import { getSessionPath, ensureAuthenticated } from "../../../harness/auth.js";
import { closeCashRegister } from "../harness/cash-register-helpers.js";
import { withPath } from "../../../harness/urls.js";
import { runPosSaleFlow } from "../harness/pos-sale-flow.js";

test.describe("POS Retail — Cash Register Lifecycle @regression", () => {
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath('retail') });

  test("validates conditional cash register open and final close", async ({ page }) => {
    test.setTimeout(180_000);
    
    const tenantBaseUrl = getTenantBaseUrl();
    const subsidiaryName = SEED.subsidiaries['retail'].name;

    await test.step("Navegar a apertura de caja", async () => {
       await ensureAuthenticated(page, {
         tenantBaseUrl,
         targetPath: '/pos/open-cash-register',
         authType: 'retail'
       });
    });

    await test.step("Evaluar estado inicial de la caja", async () => {
      try {
        await page.waitForURL(/\/pos\/(home|open-cash-register)/, { timeout: 10000 });
      } catch (e) {
        // Ignorar timeout
      }
      
      const currentUrl = page.url();
      if (currentUrl.match(/\/pos\/home/)) {
        await test.step("Caja detectada como ABIERTA: Cerrando caja antes de reabrir", async () => {
          await closeCashRegister(page, tenantBaseUrl);
          await page.goto(withPath(tenantBaseUrl, '/pos/open-cash-register'));
          await page.waitForURL(/\/pos\/open-cash-register/);
        });
      } else if (currentUrl.match(/\/pos\/open-cash-register/)) {
        await test.step("Caja detectada como CERRADA: Procediendo a apertura", async () => {
        });
      }
    });

    await test.step("Abrir la caja (Punto de emisión y monto)", async () => {
      const subsidiaryCards = page.locator('.v-card').filter({ hasText: subsidiaryName });
      if (await subsidiaryCards.first().isVisible({ timeout: 3000 })) {
        await subsidiaryCards.first().click();
        const continuarBtn = page.getByRole("button", { name: /Continuar/i });
        if (await continuarBtn.isVisible()) {
          await continuarBtn.click();
        }
      }

      await expect(page.getByText('Puntos de Emisión disponibles')).toBeVisible();
      await expect(page.getByText('Seleccione el punto de Emisión')).toBeVisible();

      const firstCheckout = page.locator('.v-card.hover\\:tw-bg-gray-200').first();
      await expect(firstCheckout).toBeVisible();
      await firstCheckout.click();

      const montoInput = page.locator('input[type="number"]').first();
      await montoInput.fill("10");

      const abrirCajaBtn = page.getByRole("button", { name: /Abrir Caja/i }).first();
      await Promise.all([
        page.waitForResponse(res => res.url().includes('cash-registers') && res.request().method() === 'POST'),
        abrirCajaBtn.click()
      ]);

      await page.waitForURL(/\/pos\/(home|restaurant-home)/);
    });

    await test.step("Realizar venta de caja de alitas de pollo", async () => {
      await runPosSaleFlow(page, {
        tenantBaseUrl,
        skipNavigation: true,
        productName: SEED.products.estandar.name,
        searchTerm: null,
      });
      await page.goto(withPath(tenantBaseUrl, '/pos/home'));
      await page.waitForURL(/\/pos\/home/);
    });

    await test.step("Cierre de caja con validación de monto", async () => {
      await closeCashRegister(page, tenantBaseUrl, {
        beforeConfirm: async () => {
          await expect(page.getByText('Apertura :')).toBeVisible();
          await expect(page.locator('span').filter({ hasText: '10' }).first()).toBeVisible();
        }
      });
    });
  });
});
