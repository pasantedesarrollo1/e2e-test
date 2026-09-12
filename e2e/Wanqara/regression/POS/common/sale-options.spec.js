import { test, expect } from "../harness/pos-fixtures.js";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { searchAndSelectProduct } from "../harness/pos-search.js";
import { completePayment } from "../harness/pos-payment.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-options.json"), "utf-8")
);

import {
  openDrawer,
  closeDrawer,
  navigateToSavedSales,
  expandAndRecoverFirstSavedSale,
} from "../harness/pos-sale-flow.js";

async function openObservationDialog(page, drawer) {
  const option = drawer.locator(".v-btn, .v-card").filter({ hasText: /Agregar Observación/i }).first();
  await option.scrollIntoViewIfNeeded().catch(() => {});
  await option.click({ force: true });
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
  await option.scrollIntoViewIfNeeded().catch(() => {});
  await option.click({ force: true });
}

async function fillAliasAndSave(page, alias) {
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Información de Guardado/i }).first();
  await expect(dialog).toBeVisible();

  const aliasInput = dialog.locator("input").first();
  await aliasInput.fill(alias);

  const saveBtn = dialog.getByRole("button", { name: /Guardar Venta/i }).first();
  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/api/v1/pos/draft-sales') &&
      res.request().method() === 'POST' &&
      res.status() === 201
    ),
    saveBtn.click({ force: true })
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Tu venta ha sido guardada/i }),
  ).toBeVisible();
}

for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Sale Options @${scenario.metadata?.testScope || 'regression'}`, () => {
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

    runTest("validates adding a note and completing a sale from the Sale Options panel", async (page) => {
      test.setTimeout(120_000);

      await test.step("Add a standard product", async () => {
        await searchAndSelectProduct(page, { name: scenario.optionsParams.productName });
      });

      await test.step("Add a sale note from the Sale Options panel", async () => {
        const triggerLocator = page.locator("button.v-btn--icon.tw-flex-shrink-0").last();
        const drawerFilter = /Opciones de venta/i;

        const drawer = await openDrawer(page, triggerLocator, drawerFilter);
        await openObservationDialog(page, drawer);
        await fillAndSaveObservation(page, scenario.optionsParams.observationText);
        await closeDrawer(page, drawerFilter);
      });

      await test.step("Complete the sale and print ticket", async () => {
        const finishBtn = page.getByRole("button", { name: /Terminar Venta/i });
        await finishBtn.click();
        await page.waitForURL(new RegExp(scenario.paymentUrlPattern));
        await completePayment(page, { printTicket: true });
      });

      await test.step("Verify 'Comprobante Impreso' notification", async () => {
        await expect(
          page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
        ).toBeVisible({ timeout: 15000 });
      });
    });

    runTest("saves a sale with an alias and then recovers it from the Saved Sales screen", async (page) => {
      test.setTimeout(240_000);

      await test.step("Add a standard product", async () => {
        await searchAndSelectProduct(page, { name: scenario.optionsParams.productName });
      });

      await test.step("Save the sale with an alias from the Sale Options panel", async () => {
        const triggerLocator = page.locator("button.v-btn--icon.tw-flex-shrink-0").last();
        const drawerFilter = /Opciones de venta/i;

        const drawer = await openDrawer(page, triggerLocator, drawerFilter);
        await openSaveSaleDialog(page, drawer);
        await fillAliasAndSave(page, scenario.optionsParams.savedSaleAlias);
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

      await test.step("Complete the recovered sale and print ticket", async () => {
        const finishBtn = page.getByRole("button", { name: /Terminar Venta/i });
        await finishBtn.click();
        await page.waitForURL(new RegExp(scenario.paymentUrlPattern));
        await completePayment(page, { printTicket: true });
      });

      await test.step("Verify 'Comprobante Impreso' notification", async () => {
        await expect(
          page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
        ).toBeVisible({ timeout: 15000 });
      });
    });
  });
}
