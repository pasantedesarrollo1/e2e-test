import { test, expect } from "../harness/pos-fixtures.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/settings.js";
import { SEED, getDynamicDocumentType } from "../../../harness/seed.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { getSessionPath } from "../../../harness/auth.js";
import { runPosSaleFlow, selectClientByCedula } from "../harness/pos-sale-flow.js";

async function addStandardProduct(page) {
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
}

async function verifyEmptyCart(page) {
  await expect(page.getByText("No hay productos seleccionados")).toBeVisible();
}

async function removeProductViaTrashIcon(page) {
  await page.locator(".v-btn.v-btn--flat.v-theme--BLUE_THEME.text-red").first().click();
}

const environments = [
  { name: 'Retail',     authType: 'retail',     fixture: 'posPage' },
  { name: 'Restaurant', authType: 'restaurant', fixture: 'posRestaurantPage' }
];

for (const env of environments) {
  test.describe(`POS ${env.name} — Cart Operations and Sale Validations @regression`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(env.authType) });

    const runTest = (title, bodyFn) => {
      if (env.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    runTest(`handles product removal and cart clearing in sale mode`, async (page) => {
      test.setTimeout(60_000);

      await test.step("Add a product and remove it via the trash icon", async () => {
        await addStandardProduct(page);
        await removeProductViaTrashIcon(page);
        await verifyEmptyCart(page);
      });

      await test.step("Add a product and clear the sale", async () => {
        await addStandardProduct(page);
        await page.getByRole("button", { name: /Limpiar Venta/i }).click();
        await verifyEmptyCart(page);
      });
    });

    runTest(`handles product removal and cart clearing in quote mode`, async (page) => {
      test.setTimeout(60_000);

      await test.step("Add a product, switch to quote mode, and remove it via the trash icon", async () => {
        await addStandardProduct(page);
        await page.getByRole("button", { name: /Cotizar/i }).click();
        await expect(page.getByRole("button", { name: /Limpiar Cotización/i })).toBeVisible();
        await removeProductViaTrashIcon(page);
        await verifyEmptyCart(page);
      });

      await test.step("Add a product, switch to quote mode, and clear the quotation", async () => {
        await addStandardProduct(page);
        const cotizarBtn = page.getByRole("button", { name: /Cotizar/i });
        const limpiarCotizacion = page.getByRole("button", { name: /Limpiar Cotización/i });
        if (!await limpiarCotizacion.isVisible()) {
          await cotizarBtn.click();
        }
        await expect(limpiarCotizacion).toBeVisible();
        await limpiarCotizacion.click();
        await verifyEmptyCart(page);
      });
    });

    runTest(`assigns a real client when sale total exceeds $50`, async (page) => {
      await test.step("Add product and set quantity above $50", async () => {
        await addStandardProduct(page);
        const amountInput = page.locator("input[inputmode='decimal']").first();
        await amountInput.fill(SEED.sale.restrictedAmount);
        await amountInput.press("Tab");
      });

      await test.step("Verify total exceeds $50 and assign a real client", async () => {
        const totalText = await page.locator(".tw-text-3xl").first().innerText();
        const total = parseFloat(totalText.replace(/[^0-9.]/g, ""));
        if (total >= 50) {
          await selectClientByCedula(page, SEED.clients.test.cedula);
        }
      });

    await test.step("Verify sale can proceed to checkout", async () => {
        await page.getByRole("button", { name: /Terminar Venta/i }).click();
        const snackbar = page.locator(".v-snackbar").filter({
          hasText: /No pueden generarse ventas por más de 50\$/i,
        });
        const isBlocked = await snackbar.isVisible();
        if (isBlocked) {
          await selectClientByCedula(page, SEED.clients.test.cedula);
          await page.getByRole("button", { name: /Terminar Venta/i }).click();
        }
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);
      });
    });

    if (env.name === 'Retail') {
      runTest(`completes a sale using a dynamic document type for a standard product`, async (page) => {
        test.setTimeout(120_000);
        await runPosSaleFlow(page, {
          tenantBaseUrl: getTenantBaseUrl(),
          skipNavigation: true,
          productName: SEED.products.estandar.name,
          searchTerm: null,
          documentType: getDynamicDocumentType(env.authType),
        });
      });
    }
  });
}