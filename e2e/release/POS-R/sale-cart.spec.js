import { test, expect } from "../../regression/harness/pos-fixtures.js";
import { requirePosCredentials } from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import { searchAndSelectProduct } from "../../regression/harness/pos-search.js";

async function addStandardProduct(page) {
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
}

async function verifyEmptyCart(page) {
  await expect(page.getByText("No hay productos seleccionados")).toBeVisible();
}

async function removeProductViaTrashIcon(page) {
  await page.locator(".v-btn.v-btn--flat.v-theme--BLUE_THEME.text-red").first().click();
}

test.describe("POS Restaurant — Cart Operations and Sale Validations @release", () => {
  requirePosCredentials(test);

  test("handles product removal and cart clearing in sale mode", async ({ posRestaurantPage: page }) => {
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

  test("handles product removal and cart clearing in quote mode", async ({ posRestaurantPage: page }) => {
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

  test("prevents final consumer sales exceeding the $50 limit", async ({ posRestaurantPage: page }) => {
    await test.step("Add product and set quantity above the limit", async () => {
      await addStandardProduct(page);
      const amountInput = page.locator("input[inputmode='decimal']").first();
      await amountInput.fill(SEED.sale.restrictedAmount);
      await amountInput.press("Tab");
    });

    await test.step("Verify that the sales limit prevents checkout", async () => {
      await page.getByRole("button", { name: /Terminar Venta/i }).click();
      await expect(
        page.locator(".v-snackbar").filter({
          hasText: /No pueden generarse ventas por más de 50\$ a Consumidor final/i,
        }),
      ).toBeVisible();
      await expect(page).not.toHaveURL(/\/pos\/payments/);
    });
  });
});