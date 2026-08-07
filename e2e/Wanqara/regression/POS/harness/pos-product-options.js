import { expect } from "@playwright/test";

export async function openProductOptions(page) {
  const menuButton = page
    .locator(".v-btn[style*='width: 25px']")
    .filter({ has: page.locator(".iconify--solar") })
    .first();
  await menuButton.click();

  const dialog = page
    .locator(".v-overlay__content .v-card")
    .filter({ hasText: /Opciones del Producto/i })
    .first();
  await expect(dialog).toBeVisible();

  return dialog;
}

export async function setQuantityInOptions(page, dialog, quantity) {
  const quantityInput = dialog.locator("input[type='number']").first();
  await quantityInput.fill(String(quantity));
  await quantityInput.press("Tab");
}

export async function setUnitPriceInOptions(page, dialog, price) {
  const priceInput = dialog.locator("input[type='text']").first();
  await priceInput.fill(String(price));
  await priceInput.press("Tab");
}

export async function setDiscountInOptions(page, dialog, discount, discountType = "Porcentaje") {
  const chipText = discountType === "Fijo" ? /Fijo/i : /Porcentaje/i;
  const chip = dialog.locator(".v-chip").filter({ hasText: chipText }).first();
  await chip.click();

  const discountInput = dialog.locator("input[type='number']").nth(1);
  await discountInput.fill(String(discount));
  await discountInput.press("Tab");
}

export async function selectPriceType(page, dialog, priceLabel) {
  const btn = dialog
    .locator("button.tw-min-h-\\[70px\\]")
    .filter({ hasText: new RegExp(priceLabel, "i") })
    .first();

  await btn.click();
  await expect(btn).toHaveClass(/selected-price-option/);
}

export async function saveProductOptions(page, dialog) {
  const saveButton = dialog
    .getByRole("button", { name: /Guardar/i })
    .first();
  
  await saveButton.click();
  await expect(dialog).not.toBeVisible();
}