/* eslint-disable */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type PosScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

type ScenarioData = PosScenario & {
  cashMovement: { monto: string; descripcion: string };
  skipPriorSale?: boolean;
  productName: string;
  paymentMethod: string;
  basePath: string;
  actions: string[];
}

import { completePayment } from "@/e2e/Wanqara/regression/POS/harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "@/e2e/Wanqara/regression/POS/harness/products/pos-search.js";
import { clickFinishSale } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-checkout-helpers.js";
import { closeDrawer, openDrawer } from "@/e2e/Wanqara/regression/POS/harness/sales/pos-drawer-helpers.js";
import type { Page, Locator } from "@playwright/test";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios: ScenarioData[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "cash-movements.json"), "utf-8")
);

async function clickCashMovementOption(page: Page, drawer: any) {
  const option = drawer.getByRole("button", { name: /Registro de Ingresos\/Egresos/i }).first();
  await option.click({ force: true });
}

async function fillAndSubmitCashForm(page: Page, type: string, scenario: any) {
  const dialog = page.locator(".v-overlay__content").filter({
    hasText: /Registro de Ingresos\/Egresos/i,
  }).first();

  const spanLabel = type === "in" ? "Ingreso" : "Egreso";
  const typeSpan = dialog.locator("span").filter({ hasText: new RegExp(`^\\s*${spanLabel}\\s*$`) }).first();
  await typeSpan.click();

  const montoField = dialog.getByPlaceholder('Monto');
  await montoField.fill(scenario.cashMovement.monto);
  await montoField.press("Tab");

  const descField = dialog.getByRole('textbox', { name: /Descripción/i });
  await descField.fill(scenario.cashMovement.descripcion);
  await descField.press("Tab");

  const saveBtnLabel = type === "in" ? /Guardar Ingreso/i : /Guardar Egreso/i;
  const saveBtn = dialog.getByRole("button", { name: saveBtnLabel }).first();
  
  await Promise.all([
    page.waitForResponse((res: any) => 
      res.url().includes('/api/v1/pos/cash-movements') && 
      res.request().method() === 'POST' && 
      res.status() === 201
    ),
    saveBtn.click({ force: true })
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Movimiento registrado exitosamente/i }),
  ).toBeVisible();

  await expect(dialog).not.toBeVisible();
}

test.describe("POS - Cash Register Income and Expense Transactions", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario) => {
    test(scenario.description, async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(180_000);
        await test.step("Venta previa y registro secuencial de ingreso y egreso", async () => {
          if (!scenario.skipPriorSale) {
            await test.step("Realizar venta simple de alitas", async () => {
              await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: undefined });
              await clickFinishSale(page);
              await completePayment(page, { paymentMethod: scenario.paymentMethod });
              const basePath = scenario.basePath;
              await page.goto(basePath);
              await page.waitForURL(new RegExp(basePath));
            });
          }

          const drawerFilter = /Opciones/i;
          const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();
          
          for (const action of scenario.actions) {
            await test.step(`Registrar ${action === 'in' ? 'ingreso' : 'egreso'}`, async () => {
              const drawer = await openDrawer(page, triggerLocator, drawerFilter);
              await clickCashMovementOption(page, drawer);
              await fillAndSubmitCashForm(page, action, scenario);
              await closeDrawer(page, drawerFilter);
            });
          }
        });
      });
    });
  });
