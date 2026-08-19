import { test } from '@playwright/test';
import {
  completeComplexOrder,
  completeExtrasWithoutObsOrder,
  completeObsWithoutExtrasOrder,
  completeSimpleOrder,
} from '../harness/order.js';
import { hasFullCredentials, requireCredentials } from '../harness/settings.js';
import { independentPosCleanup } from '../harness/pos-cleanup.js';

test.describe('Order happy path personal @regression', () => {
  const usedTableIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const cleanupPage = await context.newPage();
    
    console.log('Ejecutando limpieza independiente en POS...');
    await independentPosCleanup(cleanupPage);
    
    await context.close();
  });

  test.beforeEach(() => {
    requireCredentials(test);
  });

  test('orden simple', async ({ page }) => {
    test.skip(!hasFullCredentials(), 'Missing Playwright credentials');
    test.setTimeout(180_000);
    const tableId = await completeSimpleOrder(page, 'Personal', usedTableIds);
    usedTableIds.push(tableId);
  });

  test('orden compleja', async ({ page }) => {
    test.skip(!hasFullCredentials(), 'Missing Playwright credentials');
    test.setTimeout(240_000);
    const tableId = await completeComplexOrder(page, 'Personal', usedTableIds);
    usedTableIds.push(tableId);
  });

  test('mix observacion sin extras', async ({ page }) => {
    test.skip(!hasFullCredentials(), 'Missing Playwright credentials');
    test.setTimeout(180_000);
    const tableId = await completeObsWithoutExtrasOrder(page, 'Personal', usedTableIds);
    usedTableIds.push(tableId);
  });

  test('mix extras sin observacion', async ({ page }) => {
    test.skip(!hasFullCredentials(), 'Missing Playwright credentials');
    test.setTimeout(180_000);
    const tableId = await completeExtrasWithoutObsOrder(page, 'Personal', usedTableIds);
    test.skip(tableId === null, 'No extras available in catalog for this product');
    if (tableId) usedTableIds.push(tableId);
  });
});