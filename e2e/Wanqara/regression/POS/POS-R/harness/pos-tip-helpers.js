import { test, expect } from "@playwright/test";
import { openDrawer } from "../../harness/pos-sale-flow.js";
import { expectSnackbar } from "../../../../harness/helpers/ui-helpers.js";

export async function assignTipToSale(page, amount) {
  await test.step(`Asignar propina adicional de ${amount}`, async () => {
    const menuDotsButton = page.locator('button.tw-flex-shrink-0.v-btn--variant-tonal').first();
    
    await openDrawer(page, menuDotsButton, 'Opciones de venta');

    const addTipBtn = page.getByRole('button', { name: /(Agregar|Modificar) Propina Adicional/i });
    await expect(addTipBtn).toBeVisible();
    await addTipBtn.click();

    const tipInput = page.getByRole('spinbutton', { name: /Monto de Propina/i });
    await expect(tipInput).toBeVisible();
    await tipInput.fill(amount.toString());

    const saveTipBtn = page.getByRole('button', { name: /(Guardar|Actualizar) Propina/i });
    await saveTipBtn.click();

    await expectSnackbar(page, /Propina adicional .* guardada correctamente/i);
  });
}
