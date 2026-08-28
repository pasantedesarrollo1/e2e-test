import { expect } from "@playwright/test";
import { withPath } from "../../../../harness/urls.js";

export async function navigateToProductAndVerifyRecipeDecimals(page, {
  tenantBaseUrl,
  productName,
  ingredientName,
  exactAmount,
  roundedAmount,
}) {
  await page.goto(withPath(tenantBaseUrl, '/admin/products/list?inventory_init=false'));
  await page.waitForURL(/\/admin\/products\/list/);

  const searchInput = page.getByRole("textbox", { name: /Busca lo que necesites/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await searchInput.fill(productName);
  await page.waitForTimeout(1000);

  const row = page.locator(".v-data-table__tr").filter({ has: page.getByText(productName, { exact: true }) }).first();
  await expect(row).toBeVisible({ timeout: 15000 });

  const actionsCell = row.locator("td").last();
  const speedDialBtn = actionsCell.locator("button, .tw-relative").last();
  await speedDialBtn.click();
  
  await page.waitForTimeout(500);

  const buttons = await actionsCell.locator("button.v-btn").all();
  let clicked = false;
  
  for (const btn of buttons) {
    if (await btn.isDisabled()) {
      continue;
    }

    await btn.hover();
    
    const tooltip = page.locator(".v-overlay__content").filter({ hasText: "Ver este Producto" }).first();
    
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
    throw new Error("No se encontró el botón con el tooltip 'Ver este Producto'.");
  }

  const ingredientContainer = page
    .locator(".tw-w-32.tw-flex.tw-flex-col")
    .filter({ hasText: ingredientName })
    .first();
  await expect(ingredientContainer).toBeVisible({ timeout: 15000 });

  await expect(ingredientContainer).toContainText(roundedAmount);
  await expect(ingredientContainer).not.toContainText(exactAmount);

  const nameActivator = ingredientContainer.locator("span.tw-truncate").first();
  await nameActivator.scrollIntoViewIfNeeded();
  await nameActivator.hover();
  const tooltipContent = page.locator(".v-overlay__content").filter({ hasText: ingredientName }).last();
    
  await expect(tooltipContent).toBeVisible({ timeout: 5000 });
  await expect(tooltipContent).toContainText(exactAmount);

  await page.mouse.move(0, 0);
  await expect(tooltipContent).not.toBeVisible();
}