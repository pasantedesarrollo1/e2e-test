import { test, expect } from "@playwright/test";
import { withPath } from "../../harness/urls.js";

export async function cancelFirstSaleAndVerify(page, { tenantBaseUrl, expectSwitch, expectMessage }) {
  await test.step("Navigate to sales list", async () => {
    await page.goto(withPath(tenantBaseUrl, '/admin/sales/list'));
    await expect(
      page.locator('.v-toolbar-title').filter({ hasText: /Historial de Ventas/i }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  const firstRow = page.locator('.v-data-table__tr').first();

  await test.step("Locate the latest sale and click Cancel", async () => {
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    const actionsCell = firstRow.locator('td').last();
    const threeDotsBtn = actionsCell.locator('button.v-btn').last();
    await expect(threeDotsBtn).toBeVisible();
    await threeDotsBtn.click();

    await page.waitForTimeout(500);

    const buttons = await actionsCell.locator("button.v-btn").all();
    let clicked = false;
    
    for (const btn of buttons) {
      if (await btn.isDisabled()) {
        continue;
      }

      await btn.hover();
      const tooltip = page.locator(".v-overlay__content").filter({ hasText: "Anular esta Venta" }).first();
      
      try {
        await tooltip.waitFor({ state: "visible", timeout: 800 });
        await btn.click();
        clicked = true;
        break;
      } catch {
        continue;
      }
    }

    if (!clicked) {
      throw new Error("Could not find the 'Anular esta Venta' button in the row.");
    }
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

  await test.step("Close modal without cancelling", async () => {
    const closeBtn = modal.getByRole('button', { name: 'Cancelar', exact: true }).first();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
}