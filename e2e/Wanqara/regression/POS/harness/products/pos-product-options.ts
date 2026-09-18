import { expect, type Page, type Locator } from "@playwright/test";

export async function openProductOptions(page: Page): Promise<Locator> {
  const menuButton = page
    .locator(".v-btn[style*='width: 25px']")
    .filter({ has: page.locator(".iconify--solar") })
    .first();
  await menuButton.click();

  const dialog = page
    .locator(".v-overlay__content .v-card")
    .filter({ hasText: /Opciones del Producto|Informaci[oó]n Adicional de Producto/i })
    .first();
  await expect(dialog).toBeVisible({ timeout: 10000 });

  return dialog;
}

export async function setQuantityInOptions(page: Page, dialog: Locator, quantity: string | number): Promise<void> {
  const quantityInput = dialog.getByText("Cantidad:", { exact: true }).locator("xpath=ancestor::div[1]/following-sibling::div[1]//input").first();
  const input = await quantityInput.count() > 0 ? quantityInput : dialog.locator("input[type='number']").first();
  await input.click();
  await input.fill(String(quantity));
  await input.press("Tab");
}

export async function setUnitPriceInOptions(page: Page, dialog: Locator, price: string | number, withTaxes = false): Promise<void> {
  const label = withTaxes ? "Precio Unitario (Con Impuestos):" : "Precio Unitario (Sin Impuestos):";
  const priceInput = dialog.getByText(label).locator("xpath=ancestor::div[1]/following-sibling::div[1]//input");
  
  const input = await priceInput.count() > 0 ? priceInput.first() : dialog.locator("input[type='text']").first();
  await input.click();
  await input.fill(String(price));
  await input.press("Tab");
}

export async function setDiscountInOptions(page: Page, dialog: Locator, discount: string | number, discountType: "Porcentaje" | "Fijo" = "Porcentaje"): Promise<void> {
  const chipText = discountType === "Fijo" ? /Fijo \(\$\)/i : /Porcentaje \(%\)/i;
  const chip = dialog.locator(".v-chip").filter({ hasText: chipText }).first();
  await chip.click();

  const discountInput = dialog.getByText("Descuento:", { exact: true }).locator("xpath=ancestor::div[1]/following-sibling::div[2]//input");
  
  const input = await discountInput.count() > 0 ? discountInput.first() : dialog.locator("input[type='number']").nth(1);
  await input.click();
  await input.fill(String(discount));
  await input.press("Tab");
}

export async function selectPriceType(page: Page, dialog: Locator, priceLabel: string | RegExp): Promise<void> {
  const btn = dialog
    .locator("button.tw-min-h-\\[70px\\]")
    .filter({ hasText: new RegExp(priceLabel, "i") })
    .first();

  await btn.click();
  await expect(btn).toHaveClass(/selected-price-option/);
}

export async function saveProductOptions(page: Page, dialog: Locator): Promise<void> {
  const saveButton = dialog
    .getByRole("button", { name: /Guardar/i })
    .first();
  
  await saveButton.click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });
}
