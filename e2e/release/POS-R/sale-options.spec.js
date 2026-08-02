import { test, expect } from "../../regression/harness/pos-fixtures.js";
import { requirePosCredentials } from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import { searchAndSelectProduct } from "../../regression/harness/pos-search.js";
import { completePayment } from "../../regression/harness/pos-payment.js";
import { openDrawer, closeDrawer } from "../../regression/harness/pos-sale-flow.js";
import { withPath } from "../../harness/urls.js";
import { getTenantBaseUrl } from "../../harness/settings.js";

async function openObservationDialog(page, drawer) {
  const option = drawer.locator(".v-btn, .v-card").filter({ hasText: /Agregar Observación/i }).first();
  await option.click();
}

async function fillAndSaveObservation(page, text) {
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Agregar Observación a la Venta/i }).first();
  await expect(dialog).toBeVisible();

  const textarea = dialog.locator("textarea").first();
  await textarea.fill(text);

  const saveBtn = dialog.getByRole("button", { name: /Guardar/i }).first();
  await saveBtn.click();

  await expect(dialog).not.toBeVisible();
}

async function openSaveSaleDialog(page, drawer) {
  const option = drawer.locator(".v-btn, .v-card").filter({ hasText: /Guardar Esta Venta/i }).first();
  await option.click();
}

async function fillAliasAndSave(page, alias) {
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Información de Guardado/i }).first();
  await expect(dialog).toBeVisible();

  const aliasInput = dialog.locator("input").first();
  await aliasInput.fill(alias);

  const saveBtn = dialog.getByRole("button", { name: /Guardar Venta/i }).first();
  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes("/api/v1/pos/draft-sales") &&
      res.request().method() === "POST" &&
      res.status() === 201
    ),
    saveBtn.click({ force: true }),
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Tu venta ha sido guardada/i }),
  ).toBeVisible();
}

async function navigateToSavedSales(page, drawer) {
  const option = drawer
    .locator("button, .v-btn")
    .filter({ hasText: /Ventas Guardadas/i })
    .first();
  await option.click();
  await page.waitForURL(/\/pos\/saved-sales/);
}

async function expandAndRecoverFirstSavedSale(page) {
  const recoverBtn = page.getByRole("button", { name: "Recuperar", exact: true }).first();
  await expect(recoverBtn).toBeVisible({ timeout: 10000 });
  await expect(recoverBtn).not.toHaveAttribute("aria-busy", "true");
  await recoverBtn.click();
  await page.waitForURL(/\/pos\/restaurant-home/);
}

test.describe("POS Restaurant — Sale Options @release", () => {
  requirePosCredentials(test);

  test("validates adding a note and completing a sale from the Sale Options panel", async ({ posRestaurantPage: page }) => {
    test.setTimeout(120_000);

    await test.step("Add a standard product", async () => {
      await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
    });

    await test.step("Add a sale note from the Sale Options panel", async () => {
      const triggerLocator = page.locator("button.v-btn--icon.tw-flex-shrink-0").last();
      const drawerFilter = /Opciones de venta/i;

      const drawer = await openDrawer(page, triggerLocator, drawerFilter);
      await openObservationDialog(page, drawer);
      await fillAndSaveObservation(page, SEED.sale.observationText);
      await closeDrawer(page, drawerFilter);
    });

    await test.step("Complete the sale", async () => {
      const finishBtn = page.getByRole("button", { name: /Terminar Venta/i });
      await finishBtn.click();
      await page.waitForURL(/\/pos\/restaurant-payments/);
      await completePayment(page);
    });
  });

  test("saves a sale with an alias and then recovers it from the Saved Sales screen", async ({ posRestaurantPage: page }) => {
    test.info().annotations.push({
      type: "issue",
      description: "https://wanqara-team.atlassian.net/browse/WS-909",
    });

    test.fixme(
      true,
      "Bypass temporal (WS-909): La venta recuperada desde Ventas Guardadas no puede completarse en el POS Restaurant."
    );

    test.setTimeout(240_000);

    await test.step("Add a standard product", async () => {
      await searchAndSelectProduct(page, { name: SEED.products.estandar.name });
    });

    await test.step("Save the sale with an alias from the Sale Options panel", async () => {
      const triggerLocator = page.locator("button.v-btn--icon.tw-flex-shrink-0").last();
      const drawerFilter = /Opciones de venta/i;

      const drawer = await openDrawer(page, triggerLocator, drawerFilter);
      await openSaveSaleDialog(page, drawer);
      await fillAliasAndSave(page, SEED.sale.savedSaleAlias);
    });

    await test.step("Navigate to Saved Sales from the More Options menu", async () => {
      const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
      const drawerFilter = /Opciones/i;
      const drawer = await openDrawer(page, triggerLocator, drawerFilter);
      await navigateToSavedSales(page, drawer);
    });

    await test.step("Expand the first saved sale and recover it", async () => {
      await expandAndRecoverFirstSavedSale(page);
    });

    await test.step("Complete the recovered sale", async () => {
      const finishBtn = page.getByRole("button", { name: /Terminar Venta/i });
      await finishBtn.click();
      await page.waitForURL(/\/pos\/restaurant-payments/);
      await completePayment(page);
    });
  });
});