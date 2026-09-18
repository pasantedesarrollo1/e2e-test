import { expect, type Page } from "@playwright/test";

export interface SearchProductOptions {
  name?: string;
  searchTerm?: string;
}

export async function searchAndSelectProduct(page: Page, { name, searchTerm }: SearchProductOptions): Promise<void> {
  const searchInput = page.locator("#searchInput");

  if (searchTerm) {
    const toggleModeButton = page.getByRole("button", { name: /Nombre/i }).first();
    await toggleModeButton.click();
    
    await expect(page.getByRole("button", { name: /Código/i }).first()).toBeVisible();
    
    await searchInput.fill(searchTerm);
    await searchInput.press("Enter");
  } else if (name) {
    await searchInput.fill(name);
    await searchInput.press("Enter");

    const productCard = page
      .locator(".v-card")
      .filter({ hasText: name })
      .first();
    await productCard.click();
  }
}