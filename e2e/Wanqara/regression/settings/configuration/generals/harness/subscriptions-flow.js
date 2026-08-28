import { test, expect } from "@playwright/test";
import { withPath } from "../../../../../harness/urls.js";
import { SEED_SUBSCRIPTIONS } from "../../../../../harness/seeds/subscriptions-seed.js";

const normalizeText = (str) => {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : "";
};

export async function validateSubscriptionsOverview(page) {
  await test.step("Wait for subscriptions page to load", async () => {
    await expect(
      page.locator('span.tw-text-2xl').filter({ hasText: 'Suscripciones' })
    ).toBeVisible({ timeout: 15000 });
  });

  await test.step("Validate rendered plan against seed", async () => {
    const planElement = page.locator('.tw-bg-primary .tw-text-base.tw-font-semibold.tw-text-white');
    if (await planElement.isVisible()) {
      const planText = (await planElement.textContent()).trim();
      if (planText !== "Sin plan" && !planText.match(/^\d{3}\s-/)) {
        const normalizedDOMPlan = normalizeText(planText);
        const isValidPlan = SEED_SUBSCRIPTIONS.plans.some(p => normalizeText(p.name) === normalizedDOMPlan);
        expect(isValidPlan, `El plan visualizado "${planText}" no existe en el seed.`).toBeTruthy();
      }
    }
  });

  await test.step("Validate rendered modules against seed", async () => {
    const moduleContainers = page.locator('div.tw-min-w-0.tw-flex-1').filter({ 
      has: page.locator('div.tw-text-xs:not(.tw-text-textSecondary)') 
    });
    const count = await moduleContainers.count();

    for (let i = 0; i < count; i++) {
      const codeText = await moduleContainers.nth(i).locator('div.tw-text-xs').textContent();
      const cleanCode = codeText.trim();

      const seedMatch = SEED_SUBSCRIPTIONS.modules.find(m => m.code === cleanCode);
      
      expect(seedMatch, `El módulo con código "${cleanCode}" no existe en el seed.`).toBeDefined();
    }
  });

  await test.step("Validate rendered receipt packs against seed", async () => {
    const receiptsHeader = page.locator('span.tw-text-sm.tw-text-primary.tw-font-semibold').filter({ hasText: 'Paquetes de comprobantes' });
    
    if (await receiptsHeader.isVisible()) {
      const grid = receiptsHeader.locator('+ div.tw-grid');
      const chips = grid.locator('.v-chip');
      const chipCount = await chips.count();
      
      for (let i = 0; i < chipCount; i++) {
        const chipText = (await chips.nth(i).textContent()).trim();
        const normalizedChipText = normalizeText(chipText);
        
        const isValidReceipt = SEED_SUBSCRIPTIONS.receipts.some(r => 
          normalizeText(r.quantity) === normalizedChipText || 
          (chipText === "-1" && normalizeText(r.quantity) === "ilimitados")
        );
        expect(isValidReceipt, `El paquete de comprobantes con cantidad "${chipText}" no existe en el seed.`).toBeTruthy();
      }
    }
  });
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
        m => normalizeText(m.name) === normalizedBadgeText
      );
      
      const existsInCapabilities = SEED_SUBSCRIPTIONS.capabilityLabels.some(
        label => normalizeText(label) === normalizedBadgeText
      );

      expect(existsInModules || existsInCapabilities, `Error: La etiqueta azul "${cleanBadgeText}" en el formulario de sucursales NO coincide con ningún módulo ni capability del seed.`).toBeTruthy();
    }
  });
}