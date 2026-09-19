
import fs from "fs";
interface ActionData {
  type: string;
  name: string;
}
type ScenarioData = PosScenario & {
  searchKeyword: string;
  actions: ActionData[];
}

import path from "path";
import { fileURLToPath } from "url";
import { expect, test } from "@/e2e/Wanqara/harness/fixtures/pos.fixture.js";
import { generateDataDrivenTests, type PosScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = parseScenarios<ScenarioData>(
  JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "stress-cart-duplication.json"), "utf-8"))
);

test.describe("Product Selection Stress & Rapid-Click Testing", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    
    test('should not duplicate cart rows or corrupt store state under rapid random clicks', async ({ posEnvironment }) => {
      const { page } = posEnvironment;
      test.setTimeout(120_000); 
      const searchKeyword = scenario.searchKeyword;
    
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

      const clickTrackers: Record<string, number> = {}; 
      let addedCount = 0;

      const cartRows = page.locator('div.tw-border-l-2.tw-border-secondary');

      for (let i = 0; i < cardCount; i++) {
        const card = visibleCards.nth(i);
        const productTitle = await card.locator('.tw-font-semibold').first().innerText();
        
        const stockDot = card.locator('.stock-dot');
        const classes = await stockDot.getAttribute('class');
        
        // This is a randomized stress test; conditional paths are required to handle dynamic state.
        // eslint-disable-next-line playwright/no-conditional-in-test
        if ((classes || "").includes('tw-text-red')) {
          // force: true is used to rapidly blast clicks, intentionally bypassing Playwright's stabilization waits.
          // eslint-disable-next-line playwright/no-force-option
          await card.click({ force: true });
          const snackbar = page.getByRole('status').filter({ hasText: /No se puede agregar el/i }).first();
          // We conditionally expect the out-of-stock snackbar only when an out-of-stock item is randomly clicked.
          // eslint-disable-next-line playwright/no-conditional-expect
          await expect(snackbar).toBeVisible({ timeout: 5000 });
          continue; 
        }

        clickTrackers[productTitle] = 1;
        addedCount++;
        
        // force: true is used to rapidly blast clicks, intentionally bypassing Playwright's stabilization waits.
        // eslint-disable-next-line playwright/no-force-option
        await card.click({ force: true });
        await expect(cartRows).toHaveCount(addedCount);
      }

      await expect(cartRows).toHaveCount(addedCount);

      const burstCycles = 15; 
      for (let cycle = 0; cycle < burstCycles; cycle++) {
        const randomIndex = Math.floor(Math.random() * cardCount);
        const targetCard = visibleCards.nth(randomIndex);
        
        const stockDot = targetCard.locator('.stock-dot');
        const classes = await stockDot.getAttribute('class');
        // This is a randomized stress test; conditional paths are required to handle dynamic state.
        // eslint-disable-next-line playwright/no-conditional-in-test
        if ((classes || "").includes('tw-text-red')) {
          continue; 
        }

        const productTitle = await targetCard.locator('.tw-font-semibold').first().innerText();
        
        const randomClicks = Math.floor(Math.random() * 5) + 3; 
        clickTrackers[productTitle] += randomClicks;

        for (let click = 0; click < randomClicks; click++) {
          // force: true is used to rapidly blast clicks, intentionally bypassing Playwright's stabilization waits.
          // eslint-disable-next-line playwright/no-force-option
          await targetCard.click({ force: true });
        }
      }

      const pingPongCycles = 10;
      // Conditional branching is required here based on the dynamic number of products rendered.
      // eslint-disable-next-line playwright/no-conditional-in-test
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

          // This is a randomized stress test; conditional paths are required to handle dynamic state.
          // eslint-disable-next-line playwright/no-conditional-in-test
          if ((classesA || "").includes('tw-text-red') || (classesB || "").includes('tw-text-red')) {
            continue;
          }

          const titleA = await cardA.locator('.tw-font-semibold').first().innerText();
          const titleB = await cardB.locator('.tw-font-semibold').first().innerText();

          const pingPongClicks = Math.floor(Math.random() * 3) + 3; 
          clickTrackers[titleA] += pingPongClicks;
          clickTrackers[titleB] += pingPongClicks;

          for (let i = 0; i < pingPongClicks; i++) {
            // force: true is used to rapidly blast clicks, intentionally bypassing Playwright's stabilization waits.
            // eslint-disable-next-line playwright/no-force-option
            await cardA.click({ force: true });
            // eslint-disable-next-line playwright/no-force-option
            await cardB.click({ force: true });
          }
        }
      }

      await expect(cartRows).toHaveCount(addedCount);

      for (let i = 0; i < addedCount; i++) {
        const row = cartRows.nth(i);
        const rowTitle = await row.locator('span.tw-text-pretty').first().innerText();
        const qtyInput = row.locator("input[inputmode='decimal']").first();
        
        await expect(qtyInput).toHaveValue(clickTrackers[rowTitle].toString());
      }
    });

  });
});
