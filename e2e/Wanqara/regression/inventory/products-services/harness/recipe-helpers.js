import { expect } from "@playwright/test";
import { withPath } from "../../../../harness/urls.js";
import { clickTableRowAction } from "../../../../harness/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../harness/action-tooltips.js";

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

  await clickTableRowAction(page, row, ACTION_TOOLTIPS.products.view);

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