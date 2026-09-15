import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requirePosCredentials } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth/auth.js";
import { annotateTicket } from "../../../harness/helpers/reporting/annotate.js";
import { completePayment } from "../harness/payments/pos-payment.js";
import { searchAndSelectProduct } from "../harness/products/pos-search.js";
import { clickFinishSale } from '../harness/sales/pos-checkout-helpers.js';
import { closeDrawer, openDrawer } from '../harness/sales/pos-drawer-helpers.js';
import { expect, test } from "../harness/setup/pos-fixtures.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "cash-movements.json"), "utf-8")
);

async function clickCashMovementOption(page, drawer) {
  const option = drawer.getByRole("button", { name: /Registro de Ingresos\/Egresos/i }).first();
  await option.click({ force: true });
}

async function fillAndSubmitCashForm(page, type, scenario) {
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
    page.waitForResponse(res => 
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
  test.describe.configure({ mode: 'default' });

  if (scenarios.length > 0) {
    annotateTicket(test, scenarios[0].metadata);
  }

  for (const scenario of scenarios) {
    test.describe(`Environment: ${scenario.environment} @${scenario.metadata.testScope}`, () => {
      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType),
        subsidiaryName: scenario.subsidiaryName, subsidiaryCode: scenario.subsidiaryCode,
      openingAmount: scenario.openingAmount, authType: scenario.authType, loginMode: scenario.loginMode});

      const runTest = (title, bodyFn) => {
        if (scenario.fixture === 'posPage') {
          test(scenario.only ? `${title} (focus)` : title, { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined }, async ({ posPage: page }) => await bodyFn(page));
        } else {
          test(scenario.only ? `${title} (focus)` : title, { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined }, async ({ posRestaurantPage: page }) => await bodyFn(page));
        }
      };

      runTest(scenario.description, async (page) => {
        test.setTimeout(180_000);
        await test.step("Venta previa y registro secuencial de ingreso y egreso", async () => {
          await test.step("Realizar venta simple de alitas", async () => {
            await searchAndSelectProduct(page, { name: scenario.productName, searchTerm: null });
              await clickFinishSale(page);
              await completePayment(page, { paymentMethod: scenario.paymentMethod });
            const basePath = scenario.basePath;
            await page.goto(basePath);
            await page.waitForURL(new RegExp(basePath));
          });

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
  }
});
