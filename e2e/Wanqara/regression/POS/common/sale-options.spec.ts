/* eslint-disable */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition } from "@/e2e/Wanqara/harness/helpers/test-generator.js";

interface OptionsParams {
  productName: string;
  observationText: string;
  paymentMethod: string;
  savedSaleAlias: string;
}

interface ScenarioData extends ScenarioDefinition, TestMetadata {
  optionsParams: OptionsParams;
}

import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";
import { closeDrawer, expandAndRecoverFirstSavedSale, navigateToSavedSales, openDrawer } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-drawer-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios: ScenarioData[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-options.json"), "utf-8")
);

async function openObservationDialog(page: Page, drawer: any) {
  const option = drawer.locator(".v-btn, .v-card").filter({ hasText: /Agregar Observación/i }).first();
  await option.scrollIntoViewIfNeeded().catch(() => {});
  await option.click({ force: true });
}

async function fillAndSaveObservation(page: Page, text: any) {
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Agregar Observación a la Venta/i }).first();
  await expect(dialog).toBeVisible();

  const textarea = dialog.locator("textarea").first();
  await textarea.fill(text);

  const saveBtn = dialog.getByRole("button", { name: /Guardar/i }).first();
  await saveBtn.click();

  await expect(dialog).not.toBeVisible();
}

async function openSaveSaleDialog(page: Page, drawer: any) {
  const option = drawer.locator(".v-btn, .v-card").filter({ hasText: /Guardar Esta Venta/i }).first();
  await option.scrollIntoViewIfNeeded().catch(() => {});
  await option.click({ force: true });
}

async function fillAliasAndSave(page: Page, alias: any) {
  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Información de Guardado/i }).first();
  await expect(dialog).toBeVisible();

  const aliasInput = dialog.locator("input").first();
  await aliasInput.fill(alias);

  const saveBtn = dialog.getByRole("button", { name: /Guardar Venta/i }).first();
  await Promise.all([
    page.waitForResponse((res: any) =>
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

test.describe("Sale Options", () => {
  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario) => {
    
    test("validates adding a note and completing a sale from the Sale Options panel", async ({ posEnvironment }) => {
      const { page } = posEnvironment;
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
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);
        await completePayment(page, { paymentMethod: scenario.optionsParams.paymentMethod, printTicket: true });
      });

      await test.step("Verify 'Comprobante Impreso' notification", async () => {
        await expect(
          page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
        ).toBeVisible({ timeout: 15000 });
      });
    });

    test("saves a sale with an alias and then recovers it from the Saved Sales screen", async ({ posEnvironment }) => {
      const { page } = posEnvironment;
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
        await page.waitForURL(/\/pos\/(restaurant-)?payments/);
        await completePayment(page, { paymentMethod: scenario.optionsParams.paymentMethod, printTicket: true });
      });

      await test.step("Verify 'Comprobante Impreso' notification", async () => {
        await expect(
          page.locator(".v-snackbar").filter({ hasText: /Comprobante Impreso/i }).first()
        ).toBeVisible({ timeout: 15000 });
      });
    });

  });
});
