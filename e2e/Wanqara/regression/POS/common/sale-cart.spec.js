import { test, expect } from "../harness/pos-fixtures.js";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { runPosSaleFlow, selectClientByCedula } from "../harness/pos-sale-flow.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-cart.json"), "utf-8")
);

async function addStandardProduct(page, productName) {
  await searchAndSelectProduct(page, { name: productName });
}

async function verifyEmptyCart(page) {
  await expect(page.getByText("No hay productos seleccionados")).toBeVisible();
}

async function removeProductViaTrashIcon(page) {
  await page.locator(".v-btn.v-btn--flat.v-theme--BLUE_THEME.text-red").first().click();
}

test.describe.serial("POS Cart Operations and Sale Validations", () => {
  for (const scenario of scenarios) {
    test.describe(`Environment: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      const runTest = (title, bodyFn) => {
        if (scenario.fixture === 'posPage') {
          test(title, async ({ posPage: page }) => await bodyFn(page));
        } else {
          test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
        }
      };

      runTest(`handles product removal and cart clearing in sale mode`, async (page) => {
        test.setTimeout(60_000);

        await test.step("Add a product and remove it via the trash icon", async () => {
          await addStandardProduct(page, scenario.cartParams.productName);
          await removeProductViaTrashIcon(page);
          await verifyEmptyCart(page);
        });

        await test.step("Add a product and clear the sale", async () => {
          await addStandardProduct(page, scenario.cartParams.productName);
          await page.getByRole("button", { name: /Limpiar Venta/i }).click();
          await verifyEmptyCart(page);
        });
      });

      runTest(`handles product removal and cart clearing in quote mode`, async (page) => {
        test.setTimeout(60_000);

        await test.step("Add a product, switch to quote mode, and remove it via the trash icon", async () => {
          await addStandardProduct(page, scenario.cartParams.productName);
          await page.getByRole("button", { name: /Cotizar/i }).click();
          await expect(page.getByRole("button", { name: /Limpiar Cotización/i })).toBeVisible();
          await removeProductViaTrashIcon(page);
          await verifyEmptyCart(page);
        });

        await test.step("Add a product, switch to quote mode, and clear the quotation", async () => {
          await addStandardProduct(page, scenario.cartParams.productName);
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
          await addStandardProduct(page, scenario.cartParams.productName);
          const amountInput = page.locator("input[inputmode='decimal']").first();
          await amountInput.fill(scenario.cartParams.restrictedAmount);
          await amountInput.press("Tab");
        });

        await test.step("Verify total exceeds $50 and assign a real client", async () => {
          const totalText = await page.locator(".tw-text-3xl").first().innerText();
          const total = parseFloat(totalText.replace(/[^0-9.]/g, ""));
          if (total >= 50) {
            await selectClientByCedula(page, scenario.cartParams.testClientCedula);
          }
        });

        await test.step("Verify sale can proceed to checkout", async () => {
          await page.getByRole("button", { name: /Terminar Venta/i }).click();
          const snackbar = page.locator(".v-snackbar").filter({
            hasText: /No pueden generarse ventas por más de 50\$/i,
          });
          const isBlocked = await snackbar.isVisible();
          if (isBlocked) {
            await selectClientByCedula(page, scenario.cartParams.testClientCedula);
            await page.getByRole("button", { name: /Terminar Venta/i }).click();
          }
          await page.waitForURL(/\/pos\/(restaurant-)?payments/);
        });
      });

      if (scenario.includeDynamicDocumentTest) {
        runTest(`completes a sale using a dynamic document type for a standard product`, async (page) => {
          test.setTimeout(120_000);
          await runPosSaleFlow(page, {
            tenantBaseUrl: getTenantBaseUrl(),
            skipNavigation: true,
            productName: scenario.cartParams.productName,
            searchTerm: null,
            documentType: scenario.cartParams.dynamicDocumentType,
          });
        });
      }
    });
  }
});
