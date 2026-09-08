import { test, expect } from "../harness/pos-fixtures.js";
import { annotateTicket } from "../../../harness/annotate.js";
import { requirePosCredentials } from "../../../harness/settings.js";
import { getSessionPath } from "../../../harness/auth.js";
import { SEED } from "../../../harness/seed.js";

const STRESS_TICKET = {
  ws: 'WS-1025',
  tes: 'TES-217',
  release: 'v7.10.0',
  summary: 'POS Cart Click Stress Test',
  addedToRegression: 'true',
};

test.describe.serial('POS - Product Selection Stress & Rapid-Click Testing @regression @release', () => {
  annotateTicket(test, STRESS_TICKET);
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath("retail") });

  test('should not duplicate cart rows or corrupt store state under rapid random clicks', async ({ posPage: page }) => {
    test.setTimeout(120000); 

    const searchKeyword = SEED.searchTerms.alitas;
    
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/inventory/products-list') && response.status() === 200
    );

    const searchInput = page.getByRole('textbox', { name: 'Buscar por nombre' });
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });

    await searchInput.click();
    await searchInput.fill(searchKeyword);
    await searchInput.press('Enter');

    await apiPromise;
    
    const visibleCards = page.locator('.custom-card');
    await expect(visibleCards.first()).toBeVisible({ timeout: 10000 });
    const cardCount = await visibleCards.count();
    expect(cardCount).toBeGreaterThan(0);

    const clickTrackers = {}; 
    let addedCount = 0;

    const cartRows = page.locator('div.tw-border-l-2.tw-border-secondary');

    for (let i = 0; i < cardCount; i++) {
      const card = visibleCards.nth(i);
      const productTitle = await card.locator('.tw-font-semibold').first().innerText();
      
      const stockDot = card.locator('.stock-dot');
      const classes = await stockDot.getAttribute('class');
      
      if (classes.includes('tw-text-red')) {
        await card.click();
        const snackbar = page.getByRole('status').filter({ hasText: /No se puede agregar el/i }).first();
        await expect(snackbar).toBeVisible({ timeout: 5000 });
        continue; 
      }

      clickTrackers[productTitle] = 1;
      addedCount++;
      
      await card.click();
      await expect(cartRows).toHaveCount(addedCount);
    }

    expect(await cartRows.count()).toBe(addedCount);

    const burstCycles = 20; 
    for (let cycle = 0; cycle < burstCycles; cycle++) {
      const randomIndex = Math.floor(Math.random() * cardCount);
      const targetCard = visibleCards.nth(randomIndex);
      
      const stockDot = targetCard.locator('.stock-dot');
      const classes = await stockDot.getAttribute('class');
      if (classes.includes('tw-text-red')) {
        continue; 
      }

      const productTitle = await targetCard.locator('.tw-font-semibold').first().innerText();
      
      const randomClicks = Math.floor(Math.random() * 5) + 3; // 3 to 7 clicks
      clickTrackers[productTitle] += randomClicks;

      for (let click = 0; click < randomClicks; click++) {
        await targetCard.click();
      }
    }

    const pingPongCycles = 15;
    if (cardCount > 1) {
      for (let cycle = 0; cycle < pingPongCycles; cycle++) {
        const idxA = Math.floor(Math.random() * cardCount);
        let idxB = Math.floor(Math.random() * cardCount);
        while (idxA === idxB) { 
          idxB = Math.floor(Math.random() * cardCount); 
        }

        const cardA = visibleCards.nth(idxA);
        const cardB = visibleCards.nth(idxB);

        const classesA = await cardA.locator('.stock-dot').getAttribute('class');
        const classesB = await cardB.locator('.stock-dot').getAttribute('class');

        if (classesA.includes('tw-text-red') || classesB.includes('tw-text-red')) {
          continue;
        }

        const titleA = await cardA.locator('.tw-font-semibold').first().innerText();
        const titleB = await cardB.locator('.tw-font-semibold').first().innerText();

        const pingPongClicks = Math.floor(Math.random() * 3) + 3; // 3 to 5 alternating clicks
        clickTrackers[titleA] += pingPongClicks;
        clickTrackers[titleB] += pingPongClicks;

        for (let i = 0; i < pingPongClicks; i++) {
          await cardA.click();
          await cardB.click();
        }
      }
    }

    expect(await cartRows.count()).toBe(addedCount);

    for (let i = 0; i < addedCount; i++) {
      const row = cartRows.nth(i);
      const rowTitle = await row.locator('span.tw-text-pretty').first().innerText();
      const qtyInput = row.locator("input[inputmode='decimal']").first();
      
      await expect(qtyInput).toHaveValue(clickTrackers[rowTitle].toString());
    }
  });
});
