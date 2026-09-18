import { expect, type Page } from "@playwright/test";

async function assignManualBodega(page: Page, warehouseName?: string): Promise<void> {
  const bodegaLabel = page.locator("main").getByText("Bodega").first();
  const bodegaWrapper = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await expect(bodegaWrapper).not.toHaveClass(/v-input--disabled/, { timeout: 10000 });
  
  await expect(async () => {
    const dropdownTrigger = bodegaWrapper.locator('.v-field').first();
    await dropdownTrigger.click({ force: true, delay: 100 });
    
    const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
    await expect(listbox).toBeVisible({ timeout: 2000 });
    
    if (warehouseName) {
      const targetOption = listbox.getByRole("option", { name: new RegExp(warehouseName, "i") }).first();
      if (await targetOption.isVisible()) {
        await targetOption.click();
      } else {
        await listbox.getByRole("option").first().click();
      }
    } else {
       await listbox.getByRole("option").first().click();
    }
    
    await expect(listbox).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

async function assignManualCaja(page: Page): Promise<void> {
  const cajaLabel = page.locator("main").getByText("Punto de Venta").first();
  const cajaWrapper = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  
  await expect(cajaWrapper).not.toHaveClass(/v-input--disabled/, { timeout: 10000 });
  
  await expect(async () => {
    const dropdownTrigger = cajaWrapper.locator('.v-field').first();
    await dropdownTrigger.click({ force: true, delay: 100 });
    
    const listbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
    await expect(listbox).toBeVisible({ timeout: 2000 });
    
    await listbox.getByRole("option").first().click();
    await expect(listbox).not.toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

export interface SelectCheckoutOptions {
  urlPattern?: RegExp;
  warehouseName?: string;
}

export async function selectCheckout(page: Page, { urlPattern = /\/admin\/ventas\/add/, warehouseName }: SelectCheckoutOptions = {}): Promise<void> {
  await page.waitForURL(urlPattern);

  const bodegaLabel = page.locator("main").getByText("Bodega").first();
  await bodegaLabel.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
  
  if (await bodegaLabel.isVisible()) {
    const bodegaWrapper = bodegaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
    
    if (warehouseName) {
      await assignManualBodega(page, warehouseName);
    } else {
      await expect(async () => {
        const text = await bodegaWrapper.innerText();
        const cleanText = text.replace(/Bodega|\*/ig, "").trim();
        expect(cleanText.length).toBeGreaterThan(0);
      }).toPass({ timeout: 15000 });
    }
  }

  const cajaLabel = page.locator("main").getByText("Punto de Venta").first();
  await expect(cajaLabel).toBeVisible({ timeout: 10000 });
  
  const cajaWrapper = cajaLabel.locator('xpath=following::div[contains(@class, "v-input")][1]');
  const cajaText = await cajaWrapper.innerText();
  const cleanCajaText = cajaText.replace(/Punto de Venta|Caja|\*/ig, "").trim();
  
  if (cleanCajaText.length === 0) {
    await assignManualCaja(page);
  }

  await page.keyboard.press("Escape");
  await expect(page.locator(".v-overlay-container .v-overlay--active")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
}

export interface SearchProductOptions {
  name: string | RegExp;
  searchTerm?: string | RegExp | null;
}

export async function searchAndSelectProduct(page: Page, { name, searchTerm }: SearchProductOptions): Promise<void> {
  const term = searchTerm || name;
  const termStr = typeof term === 'string' ? term : term.source;

  const profileOverlay = page.locator(".v-overlay--active").filter({ hasText: /Cerrar Sesión/i });
  if (await profileOverlay.isVisible()) {
    await page.keyboard.press("Escape");
    await expect(profileOverlay).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  }

  const searchInput = page.locator("#searchInput").first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  
  await searchInput.click();
  await searchInput.clear();

  await searchInput.pressSequentially(termStr, { delay: 30 });
  
  await page.waitForResponse(res => res.url().includes('products') && res.request().method() === 'GET', { timeout: 3000 }).catch(() => {});

  const productItem = page.getByText(name, { exact: false }).first();
  await expect(productItem).toBeVisible({ timeout: 20000 });
  await productItem.click();
  
  const overlayContent = page.locator(".v-overlay-container .v-overlay__content").filter({ has: productItem });
  await expect(overlayContent).not.toBeVisible({ timeout: 10000 }).catch(() => {});
}

export async function selectPaymentMethod(page: Page, methodName: string | RegExp): Promise<void> {
  if (!methodName) throw new Error("selectPaymentMethod requires methodName parameter.");
  const methodItem = page.getByText(methodName, { exact: true }).first();
  await methodItem.scrollIntoViewIfNeeded();
  await methodItem.click({ force: true });
}

export async function submitAdminSale(page: Page, endpoint = "/api/v2/billing/sales"): Promise<void> {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true }).first();

  await expect(saveBtn).toBeVisible({ timeout: 10000 });
  await expect(saveBtn).toBeEnabled({ timeout: 15000 });

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes(endpoint) && res.request().method() === "POST",
      { timeout: 30000 }
    ),
    saveBtn.click({ force: true }),
  ]);

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Venta guardada/i }).first()
  ).toBeVisible({ timeout: 15000 });
}
