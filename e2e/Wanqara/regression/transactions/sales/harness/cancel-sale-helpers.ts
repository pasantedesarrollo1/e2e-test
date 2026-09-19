import { expect, test, type Page } from "@playwright/test";
import { clickTableRowAction } from "@/e2e/Wanqara/harness/helpers/admin/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/admin/action-tooltips.js";

export interface CancelSaleOptions {
  expectSwitch: boolean;
  expectMessage: boolean;
  confirmCancellation?: boolean;
  annulmentReason?: string;
}

export async function cancelFirstSaleAndVerify(page: Page, { 
  expectSwitch, 
  expectMessage, 
  confirmCancellation = true, 
  annulmentReason = "Anulación automatizada por E2E" 
}: CancelSaleOptions): Promise<void> {
  const getSalesPromise = page.waitForResponse(res => 
    res.url().includes('/api/v1/billing/sales') && 
    res.request().method() === 'GET'
  );

  await test.step("Navigate to sales list", async () => {
    await page.goto('/admin/sales/list');
    await page.reload(); 
    
    await expect(
      page.locator('.v-toolbar-title').filter({ hasText: /Historial de Ventas/i }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  await test.step("Validate 'can_return_inventory' append is present", async () => {
    const getResponse = await getSalesPromise;
    expect(getResponse.url()).toContain('can_return_inventory');
  });

  const firstRow = page.locator('.v-data-table__tr').first();

  await test.step("Locate the latest sale and click Cancel", async () => {
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await clickTableRowAction(page, firstRow, ACTION_TOOLTIPS.sales.cancel);
  });

  const modal = page.locator('.v-overlay__content').filter({ hasText: /Información de Anulación/i }).first();

  await test.step("Validate cancellation business rules in the modal", async () => {
    await expect(modal).toBeVisible({ timeout: 5000 });
    const inventorySwitch = modal.locator('.v-switch').filter({ hasText: /Mover inventario/i });
    const noInventoryMsg = modal.getByText(/Esta venta no tiene movimientos de inventario/i);

    // Conditional logic is required in helpers to handle dynamic UI states during the cancellation flow.
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (expectSwitch) {
      await expect(inventorySwitch).toBeVisible();
    } else {
      await expect(inventorySwitch).toBeHidden();
    }

    // Conditional logic is required in helpers to handle dynamic UI states during the cancellation flow.
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (expectMessage) {
      await expect(noInventoryMsg).toBeVisible();
    } else {
      await expect(noInventoryMsg).toBeHidden();
    }
  });

  if (confirmCancellation) {
    await test.step("Confirm cancellation and validate POST payload", async () => {
      const postCancelPromise = page.waitForResponse(res => 
        res.url().includes('/cancel') && 
        res.request().method() === 'POST'
      );

      const observationInput = modal.getByRole("textbox", { name: /Motivo de anulación/i });
      await observationInput.fill(annulmentReason);

      // Conditional logic is required in helpers to handle dynamic UI states during the cancellation flow.
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (expectSwitch) {
        const inventorySwitch = modal.locator('.v-switch').filter({ hasText: /Mover inventario/i });
        // Vuetify DOM overlaps and animations require forced interactions to bypass strict actionability checks.
        // eslint-disable-next-line playwright/no-force-option
        await inventorySwitch.locator('input[type="checkbox"]').check({ force: true });
      }

      const anularBtn = modal.getByRole('button', { name: 'Anular Venta', exact: true });
      await anularBtn.click();

      const confirmDialog = page.locator('.v-overlay__content').filter({ hasText: /Confirmar anulación/i }).last();
      const finalConfirmBtn = confirmDialog.getByRole('button', { name: /Confirmar anulación/i });
      await finalConfirmBtn.click();

      const postResponse = await postCancelPromise;
      const postData = postResponse.request().postDataJSON() as { moves_inventory?: boolean };

      expect(postData).toHaveProperty('moves_inventory');
      expect(typeof postData.moves_inventory).toBe('boolean');
      
      // Conditional logic is required in helpers to handle dynamic UI states during the cancellation flow.
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (expectSwitch) {
        expect(postData.moves_inventory).toBe(true);
      } else {
        expect(postData.moves_inventory).toBe(false);
      }
    });
  } else {
    await test.step("Close modal without cancelling", async () => {
      const closeBtn = modal.getByRole('button', { name: 'Cancelar', exact: true }).first();
      await closeBtn.click();
      await expect(modal).toBeHidden();
    });
  }
}