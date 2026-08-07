import { expect } from "@playwright/test";

export async function searchAndSelectProduct(page, { name, searchTerm }) {
  const searchInput = page.locator("#searchInput");

  if (searchTerm) {
    const toggleModeButton = page.getByRole("button", { name: /Nombre/i }).first();
    await toggleModeButton.click();
    
    await expect(page.getByRole("button", { name: /Código/i }).first()).toBeVisible();
    
    await searchInput.fill(searchTerm);
    await searchInput.press("Enter");
  } else {
    await searchInput.fill(name);
    await searchInput.press("Enter");

    const productCard = page
      .locator(".v-card")
      .filter({ hasText: name })
      .first();
    await productCard.click();
  }
}