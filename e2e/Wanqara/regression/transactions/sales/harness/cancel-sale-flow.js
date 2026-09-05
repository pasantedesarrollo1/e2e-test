import { test, expect } from "@playwright/test";
import { withPath } from "../../../../harness/urls.js";
import { SEED } from "../../../../harness/seed.js";
import { clickTableRowAction } from "../../../../harness/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../harness/action-tooltips.js";

export async function cancelFirstSaleAndVerify(page, { tenantBaseUrl, expectSwitch, expectMessage, confirmCancellation = true }) {
  const getSalesPromise = page.waitForResponse(res => 
    res.url().includes('/api/v1/billing/sales') && 
    res.request().method() === 'GET'
  );

  await test.step("Navigate to sales list", async () => {
    await page.goto(withPath(tenantBaseUrl, '/admin/sales/list'));
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

    if (expectSwitch) {
      await expect(inventorySwitch).toBeVisible();
    } else {
      await expect(inventorySwitch).not.toBeVisible();
    }

    if (expectMessage) {
      await expect(noInventoryMsg).toBeVisible();
    } else {
      await expect(noInventoryMsg).not.toBeVisible();
    }
  });

  if (confirmCancellation) {
    await test.step("Confirm cancellation and validate POST payload", async () => {
      const postCancelPromise = page.waitForResponse(res => 
        res.url().includes('/cancel') && 
        res.request().method() === 'POST'
      );

      const observationInput = modal.getByRole("textbox", { name: /Motivo de anulación/i });
      await observationInput.fill(SEED.sale.annulmentReason);

      if (expectSwitch) {
        const inventorySwitch = modal.locator('.v-switch').filter({ hasText: /Mover inventario/i });
        await inventorySwitch.locator('input[type="checkbox"]').check({ force: true });
      }

      const anularBtn = modal.getByRole('button', { name: 'Anular Venta', exact: true });
      await anularBtn.click();

      const confirmDialog = page.locator('.v-overlay__content').filter({ hasText: /Confirmar anulación/i }).last();
      const finalConfirmBtn = confirmDialog.getByRole('button', { name: /Confirmar anulación/i });
      await finalConfirmBtn.click();

      const postResponse = await postCancelPromise;
      const postData = postResponse.request().postDataJSON();

      expect(postData).toHaveProperty('moves_inventory');
      expect(typeof postData.moves_inventory).toBe('boolean');
      
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
      await expect(modal).not.toBeVisible();
    });
  }
}