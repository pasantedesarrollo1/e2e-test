import { test, expect } from "../../regression/harness/pos-fixtures.js";
import { requirePosCredentials } from "../../harness/settings.js";
import { SEED } from "../../harness/seed.js";
import { openDrawer, closeDrawer } from "../../regression/harness/pos-sale-flow.js";

async function clickCashMovementOption(page, drawer) {
  const option = drawer.getByRole("button", { name: /Registro de Ingresos\/Egresos/i }).first();
  await option.click();
}

async function fillAndSubmitCashForm(page, type) {
  const dialog = page.locator(".v-overlay__content").filter({
    hasText: /Registro de Ingresos\/Egresos/i,
  }).first();

  const spanLabel = type === "in" ? "Ingreso" : "Egreso";
  const typeSpan = dialog.locator("span").filter({ hasText: new RegExp(`^\\s*${spanLabel}\\s*$`) }).first();
  await typeSpan.click();

  const montoField = dialog.getByPlaceholder("Monto");
  await montoField.fill(SEED.cashMovement.monto);
  await montoField.press("Tab");

  const descField = dialog.getByRole("textbox", { name: /Descripción/i });
  await descField.fill(SEED.cashMovement.descripcion);
  await descField.press("Tab");

  const saveBtnLabel = type === "in" ? /Guardar Ingreso/i : /Guardar Egreso/i;
  const saveBtn = dialog.getByRole("button", { name: saveBtnLabel }).first();

  await Promise.all([
    page.waitForResponse(res =>
      res.url().includes("/api/v1/pos/cash-movements") &&
      res.request().method() === "POST" &&
      res.status() === 201
    ),
    saveBtn.click({ force: true }),
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Movimiento registrado exitosamente/i }),
  ).toBeVisible();

  await expect(dialog).not.toBeVisible();
}

test.describe("POS Restaurant — Cash Register Income and Expense Transactions @release", () => {
  requirePosCredentials(test);

  test("records both a cash income and a cash expense from the More Options menu", async ({ posRestaurantPage: page }) => {
    test.setTimeout(180_000);

    const drawerFilter = /Opciones/i;
    const triggerLocator = page.getByRole("button", { name: /Más Opciones/i }).first();

    await test.step("Scenario 1: Record a cash income", async () => {
      const drawer = await openDrawer(page, triggerLocator, drawerFilter);
      await clickCashMovementOption(page, drawer);
      await fillAndSubmitCashForm(page, "in");
    });

    await test.step("Scenario 2: Record a cash expense", async () => {
      await closeDrawer(page, drawerFilter);
      const drawer = await openDrawer(page, triggerLocator, drawerFilter);
      await clickCashMovementOption(page, drawer);
      await fillAndSubmitCashForm(page, "out");
    });
  });
});