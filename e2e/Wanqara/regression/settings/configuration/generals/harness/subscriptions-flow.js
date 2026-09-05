import { test, expect } from "@playwright/test";
import { withPath } from "../../../../../harness/urls.js";
import { SEED_SUBSCRIPTIONS } from "../../../../../harness/seeds/subscriptions-seed.js";

const normalizeText = (str) => {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : "";
};

export async function validateSubscriptionsOverview(page) {
  const cards = page.locator('.clase-de-tarjeta');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const codeElement = card.locator('.clase-del-codigo');
    
    if (await codeElement.isVisible()) {
      const codeText = await codeElement.innerText();
      const normalizedDOMCode = normalizeText(codeText);
      
      const isValidPlan = SEED_SUBSCRIPTIONS.plans.some(p => normalizeText(p.code) === normalizedDOMCode);
      const isValidModule = SEED_SUBSCRIPTIONS.modules.some(m => normalizeText(m.code) === normalizedDOMCode);
      
      expect(isValidPlan || isValidModule, `El código "${codeText}" no existe en el seed.`).toBeTruthy();
    }
  }
}

export async function validateSubsidiaryCapabilityBadges(page, tenantBaseUrl) {
  await test.step("Navigate to subsidiary creation form", async () => {
    await page.goto(withPath(tenantBaseUrl, '/admin/subsidiaries/add'));
    await expect(page.getByText('Agregar una Sucursal').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step("Validate capability badges against seed", async () => {
    const badges = page.locator('span.tw-bg-primary.tw-text-white.tw-rounded-br-md.tw-rounded-tl-md');
    await badges.first().waitFor({ state: 'visible', timeout: 10000 });
    
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      const cleanBadgeText = badgeText.trim();
      const normalizedBadgeText = normalizeText(cleanBadgeText);

      const existsInModules = SEED_SUBSCRIPTIONS.modules.some(
        m => normalizeText(m.code) === normalizedBadgeText
      );
      
      const existsInCapabilities = SEED_SUBSCRIPTIONS.capabilityLabels.some(
        label => normalizeText(label) === normalizedBadgeText
      );

      expect(existsInModules || existsInCapabilities, `Error: La etiqueta azul "${cleanBadgeText}" en el formulario de sucursales NO coincide con ningún módulo ni capability del seed.`).toBeTruthy();
    }
  });
}