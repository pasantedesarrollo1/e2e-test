import { expect, type Locator, type Page } from '@playwright/test';
import { pageTestId } from './ionic.js';

export type OpenTableOptions = {
  excludeIds?: string[];
};

export type OpenTableResult = {
  tableId: string;
};

function tableIdFromTestId(testId: string | null): string | null {
  if (!testId?.startsWith('table-card-')) return null;
  return testId.slice('table-card-'.length) || null;
}

async function pickUnusedTable(
  cards: Locator,
  excluded: Set<string>,
): Promise<{ card: Locator; tableId: string } | null> {
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    if (!(await card.isVisible().catch(() => false))) continue;
    const tableId = tableIdFromTestId(await card.getAttribute('data-testid'));
    if (!tableId || excluded.has(tableId)) continue;
    return { card, tableId };
  }
  return null;
}

/**
 * Open first Disponible table; if none, fall back to first Ocupada.
 * Skips ids in excludeIds so each case can use a different table.
 */
export async function openTableForOrder(
  page: Page,
  { excludeIds = [] }: OpenTableOptions = {},
): Promise<OpenTableResult> {
  await page.goto('/tables');
  const root = pageTestId(page, 'tables-hub');
  await expect(root).toBeVisible({ timeout: 30_000 });

  const excluded = new Set(excludeIds.filter(Boolean));
  const available = root.locator(
    '[data-testid^="table-card-"][data-table-status="Disponible"]',
  );
  const occupied = root.locator(
    '[data-testid^="table-card-"][data-table-status="Ocupada"]',
  );

  const picked =
    (await pickUnusedTable(available, excluded)) ??
    (await pickUnusedTable(occupied, excluded));

  if (!picked) {
    throw new Error(
      `No unused Disponible/Ocupada table (excluded: ${JSON.stringify([...excluded])})`,
    );
  }

  await picked.card.click();
  await expect(page).toHaveURL(
    new RegExp(`/table/${picked.tableId}/(products-list|orders)`),
    { timeout: 30_000 },
  );
  return { tableId: picked.tableId };
}

export async function expectTablesHub(page: Page) {
  await page.goto('/tables');
  await expect(page).toHaveURL(/\/tables/);
  await expect(page).not.toHaveURL(/\/check-responsible/);
  await expect(pageTestId(page, 'tables-hub')).toBeVisible({ timeout: 30_000 });
}
