/* eslint-disable */
import type { Page } from '@playwright/test';
export interface SubscriptionData { companyName?: string; status?: string; activeSubsidiaries?: number; activeUsers?: number; nextBillingDate?: string; badges?: string[]; modules?: any[]; receipts?: any[]; plans?: any[]; capabilityLabels?: string[]; moduleLabels?: string[]; }
export interface ValidateBadgesOptions { subscriptionData: SubscriptionData; }
import { expect, test } from "@playwright/test";
const normalizeText = (str: any) => {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : "";
};

export async function validateSubscriptionsOverview(page: Page, subscriptionData: SubscriptionData): Promise<void> {
  const codeLocator = page.locator('.tw-min-w-0.tw-flex-1 > div.tw-text-xs:not(.tw-text-textSecondary)');
  
  await codeLocator.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  
  const count = await codeLocator.count();

  for (let i = 0; i < count; i++) {
    const codeText = await codeLocator.nth(i).innerText();
    const normalizedDOMCode = normalizeText(codeText);
    
    const isValidPlan = subscriptionData.plans!.some((p: any) => normalizeText(p.code) === normalizedDOMCode);
    const isValidModule = subscriptionData.modules!.some((m: any) => normalizeText(m.code) === normalizedDOMCode);
    
    expect(isValidPlan || isValidModule, `Error: El código "${codeText}" no existe en la configuración JSON.`).toBeTruthy();
  }
}

export async function validateSubsidiaryCapabilityBadges(page: Page, { subscriptionData }: ValidateBadgesOptions): Promise<void> {
  await test.step("Navigate to subsidiary creation form", async () => {
    await page.goto('/admin/subsidiaries/add');
    await expect(page.getByText(/Agregar una Sucursal|Nueva Sucursal/i).first()).toBeVisible({ timeout: 15000 });
  });

  await test.step("Validate capability badges against JSON data", async () => {
    const badges = page.locator('span.tw-bg-primary.tw-text-white.tw-rounded-br-md.tw-rounded-tl-md');
    
    await badges.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      const cleanBadgeText = (badgeText || "").trim();
      const normalizedBadgeText = normalizeText(cleanBadgeText);

      const existsInModules = subscriptionData.moduleLabels!.some(
        label => normalizeText(label) === normalizedBadgeText
      );
      
      const existsInCapabilities = subscriptionData.capabilityLabels!.some(
        label => normalizeText(label) === normalizedBadgeText
      );

      expect(existsInModules || existsInCapabilities, `Error: La etiqueta azul "${cleanBadgeText}" en el formulario de sucursales NO coincide con ningún módulo ni capability del JSON.`).toBeTruthy();
    }
  });
}
