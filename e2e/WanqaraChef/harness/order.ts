import { expect, type Page } from '@playwright/test';
import { completeWorkstationPin } from './auth.js';
import { playwrightHarness } from './settings.js';
import { openTableForOrder } from './tables.js';

export type WorkMode = 'Workstation' | 'Personal';

export function observationText(n: number): string {
  return `Prueba desde Playwright #${n}`;
}

export function tableAliasText(n: number): string {
  return `PW Alias #${n}`;
}

async function goToProductsIfNeeded(page: Page) {
  if (/\/products-list/.test(page.url())) return;

  if (/\/orders|\/cart|\/order-prints/.test(page.url())) {
    const productsTab = page.getByRole('tab', { name: /Productos/i });
    if (await productsTab.isVisible().catch(() => false)) {
      await productsTab.click();
    } else {
      const match = page.url().match(/\/table\/([^/]+)/);
      if (match) {
        await page.goto(`/table/${match[1]}/products-list`);
      }
    }
  }

  await expect(page).toHaveURL(/\/products-list/, { timeout: 30_000 });
}

async function openProductCard(page: Page, cardIndex: number) {
  await goToProductsIfNeeded(page);
  const productCard = page.getByTestId('product-card').nth(cardIndex);
  await expect(productCard).toBeVisible({ timeout: 30_000 });
  await productCard.click();
  await expect(page.getByTestId('product-modal-confirm')).toBeVisible({ timeout: 20_000 });
}

async function setModalQuantity(page: Page, target: number) {
  const qty = page.getByTestId('product-modal-qty');
  await expect(qty).toBeVisible({ timeout: 10_000 });

  for (let guard = 0; guard < 20; guard++) {
    const current = Number((await qty.innerText()).trim());
    if (Number.isNaN(current)) {
      throw new Error(`Invalid modal quantity text: ${await qty.innerText()}`);
    }
    if (current === target) return;
    if (current < target) {
      await page.getByTestId('product-modal-qty-increment').click();
    } else {
      await page.getByTestId('product-modal-qty-decrement').click();
    }
  }

  await expect(qty).toHaveText(String(target), { timeout: 5_000 });
}

async function confirmProductModal(page: Page) {
  const confirm = page.getByTestId('product-modal-confirm');
  await expect(confirm).toBeEnabled({ timeout: 10_000 });
  await confirm.click();
  await expect(confirm).toBeHidden({ timeout: 20_000 });
}

async function addAdditionalInfoEntry(page: Page) {
  const add = page.getByTestId('product-add-additional-info');
  await expect(add).toBeVisible({ timeout: 10_000 });
  await expect(add).toBeEnabled({ timeout: 10_000 });
  await add.click();
}

async function setEntryQuantity(page: Page, entryIndex: number, target: number) {
  const entry = page.getByTestId(`product-additional-entry-${entryIndex}`);
  await expect(entry).toBeVisible({ timeout: 10_000 });

  for (let guard = 0; guard < 20; guard++) {
    const qtyText = await entry.locator('span.min-w-6').first().innerText();
    const current = Number(qtyText.trim());
    if (current === target) return;
    if (current < target) {
      await page.getByTestId(`product-entry-qty-increment-${entryIndex}`).click();
    } else {
      break;
    }
  }
}

async function addObservationToEntry(page: Page, entryIndex: number, text: string) {
  await page.getByTestId(`product-obs-open-${entryIndex}`).click();
  const input = page.getByTestId('product-obs-input');
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.locator('input').first().fill(text);
  await page.getByTestId('product-obs-add').click();
  await page.getByTestId('product-obs-confirm').click();
  await expect(page.getByText(text, { exact: true }).first()).toBeVisible({ timeout: 10_000 });
}

type AddExtrasOptions = {
  /** Distinct extras to select (best-effort if catalog has fewer). */
  distinctCount?: number;
  /** Quantity for the first selected extra (must be >= 1). */
  firstExtraQty?: number;
};

/**
 * Selects multiple extras for an entry; first extra gets qty > 1 when requested.
 * @returns number of distinct extras selected (0 if none available)
 */
async function addExtrasToEntry(
  page: Page,
  entryIndex: number,
  { distinctCount = 2, firstExtraQty = 2 }: AddExtrasOptions = {},
): Promise<number> {
  await page.getByTestId(`product-extras-open-${entryIndex}`).click();

  const empty = page.getByTestId('product-extras-empty');
  const options = page.getByTestId('product-extra-option');

  await Promise.race([
    empty.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => null),
    options.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => null),
  ]);

  if (await empty.isVisible().catch(() => false)) {
    await page.getByTestId('product-extras-confirm').click();
    return 0;
  }

  const available = await options.count();
  if (available === 0) {
    await page.getByTestId('product-extras-confirm').click();
    return 0;
  }

  const toSelect = Math.min(Math.max(1, distinctCount), available);
  const targetFirstQty = Math.max(1, firstExtraQty);

  for (let i = 0; i < toSelect; i++) {
    const option = options.nth(i);
    const increment = option.getByTestId('product-extra-increment');
    const clicks = i === 0 ? targetFirstQty : 1;
    for (let c = 0; c < clicks; c++) {
      const disabled = await increment.isDisabled().catch(() => false);
      if (disabled) break;
      await increment.click({ force: true });
    }
  }

  await page.getByTestId('product-extras-confirm').click();
  return toSelect;
}

export async function addSimpleProductToCart(page: Page, cardIndex = 0) {
  await openProductCard(page, cardIndex);
  await confirmProductModal(page);
}

export async function addProductWithObsOnly(
  page: Page,
  {
    cardIndex = 0,
    quantity = 2,
    observation = observationText(1),
  }: { cardIndex?: number; quantity?: number; observation?: string } = {},
) {
  await openProductCard(page, cardIndex);
  await setModalQuantity(page, quantity);
  await addAdditionalInfoEntry(page);
  await addObservationToEntry(page, 0, observation);
  await confirmProductModal(page);
}

export async function addProductWithExtrasOnly(
  page: Page,
  { cardIndex = 0 }: { cardIndex?: number } = {},
): Promise<boolean> {
  await openProductCard(page, cardIndex);
  await addAdditionalInfoEntry(page);
  // Multiple extras + first extra qty 2 (skip only if catalog has zero extras).
  const selected = await addExtrasToEntry(page, 0, {
    distinctCount: 2,
    firstExtraQty: 2,
  });
  if (selected === 0) {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.goto('/tables');
    return false;
  }
  await confirmProductModal(page);
  return true;
}

export async function addComplexProductsToCart(page: Page) {
  // Product 0: qty 2, 1 entry, obs #1, multiple extras (first qty 2)
  await openProductCard(page, 0);
  await setModalQuantity(page, 2);
  await addAdditionalInfoEntry(page);
  await addObservationToEntry(page, 0, observationText(1));
  await addExtrasToEntry(page, 0, { distinctCount: 2, firstExtraQty: 2 });
  await confirmProductModal(page);

  // Product 1: qty 3, 2 entries (qty 1 + qty 2), obs #2 / #3, extras on entry0
  await openProductCard(page, 1);
  await setModalQuantity(page, 3);
  await addAdditionalInfoEntry(page);
  await addObservationToEntry(page, 0, observationText(2));
  await addExtrasToEntry(page, 0, { distinctCount: 2, firstExtraQty: 2 });
  await addAdditionalInfoEntry(page);
  await setEntryQuantity(page, 1, 2);
  await addObservationToEntry(page, 1, observationText(3));
  await confirmProductModal(page);

  // Product 2: qty 1, 1 entry, obs #4
  await openProductCard(page, 2);
  await addAdditionalInfoEntry(page);
  await addObservationToEntry(page, 0, observationText(4));
  await confirmProductModal(page);
}

export async function fillTableDetails(
  page: Page,
  {
    alias,
    pax,
    urgent,
  }: {
    alias: string;
    pax: number;
    urgent: boolean;
  },
) {
  await page.getByTestId('tab-cart').click();
  await expect(page).toHaveURL(/\/cart/, { timeout: 20_000 });

  await page.getByTestId('cart-table-details').click();
  const aliasInput = page.getByTestId('table-details-alias');
  await expect(aliasInput).toBeVisible({ timeout: 15_000 });
  await aliasInput.locator('input').first().fill(alias);

  const paxLabel = page.getByTestId('table-details-pax');
  for (let guard = 0; guard < 30; guard++) {
    const current = Number((await paxLabel.innerText()).trim());
    if (current === pax) break;
    if (current < pax) {
      await page.getByTestId('table-details-pax-increment').click();
    } else {
      await page.getByTestId('table-details-pax-decrement').click();
    }
  }
  await expect(paxLabel).toHaveText(String(pax), { timeout: 5_000 });

  const urgentToggle = page.getByTestId('table-details-urgent');
  const checked = await urgentToggle.evaluate((el) => {
    const host = el as HTMLElement & { checked?: boolean };
    if (typeof host.checked === 'boolean') return host.checked;
    return host.getAttribute('aria-checked') === 'true';
  });
  if (checked !== urgent) {
    await urgentToggle.click();
  }

  await page.getByTestId('table-details-save').click();
  await expect(aliasInput).toBeHidden({ timeout: 15_000 });
}

export async function openCartAndFinishOrder(page: Page) {
  if (!/\/cart/.test(page.url())) {
    await page.getByTestId('tab-cart').click();
    await expect(page).toHaveURL(/\/cart/, { timeout: 20_000 });
  }

  const finish = page.getByTestId('cart-finish-order');
  await expect(finish).toBeEnabled({ timeout: 20_000 });
  await finish.click();

  const continuar = page.getByRole('button', { name: /^Continuar$/i });
  await expect(continuar).toBeVisible({ timeout: 60_000 });
  await continuar.click();
}

type TicketAssertOptions = {
  tableId: string;
  observations?: string[];
  alias?: string;
  pax?: number;
  urgent?: boolean;
};

export async function finishOrderAndAssertTickets(
  page: Page,
  mode: WorkMode,
  { tableId, observations = [], alias, pax, urgent }: TicketAssertOptions,
) {
  await openCartAndFinishOrder(page);

  if (mode === 'Personal') {
    await expect(page).toHaveURL(new RegExp(`/table/${tableId}/orders`), {
      timeout: 30_000,
    });
  } else {
    await expect(page).toHaveURL(/\/check-responsible/, { timeout: 30_000 });
    await completeWorkstationPin(page, playwrightHarness.workstationCode);
    await page.goto(`/table/${tableId}/orders`);
  }

  await expect(page.getByTestId('tickets-list')).toBeVisible({ timeout: 30_000 });
  // Prefer visible order-card — Ionic may keep a hidden duplicate in the DOM.
  const orderCard = page.getByTestId('order-card').filter({ visible: true }).first();
  await expect(orderCard).toBeVisible();

  for (const obs of observations) {
    await expect(
      orderCard.getByText(obs, { exact: true }).or(
        page.getByText(obs, { exact: true }).filter({ visible: true }),
      ).first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  if (alias) {
    await expect(
      orderCard.getByText(alias, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  if (typeof pax === 'number') {
    await expect(
      orderCard.getByText(new RegExp(`Ocupantes:\\s*${pax}`)).filter({ visible: true }),
    ).toBeVisible({ timeout: 20_000 });
  }

  if (urgent) {
    const urgentBtn = orderCard.locator('ion-button[id^="urgent-popover-"]').first();
    await expect(urgentBtn).toBeVisible({ timeout: 20_000 });
    await urgentBtn.click();
    await expect(
      page.getByText(/Pedido urgente/i).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 10_000 });
  }
}

async function withTable(
  page: Page,
  excludeIds: string[],
  run: (tableId: string) => Promise<void>,
): Promise<string> {
  const { tableId } = await openTableForOrder(page, { excludeIds });
  await run(tableId);
  return tableId;
}

async function finishWithTableDetails(
  page: Page,
  mode: WorkMode,
  tableId: string,
  caseNumber: number,
  extra: Omit<TicketAssertOptions, 'tableId' | 'alias' | 'pax' | 'urgent'> = {},
) {
  const alias = tableAliasText(caseNumber);
  const pax = 3;
  await fillTableDetails(page, { alias, pax, urgent: true });
  await finishOrderAndAssertTickets(page, mode, {
    tableId,
    alias,
    pax,
    urgent: true,
    ...extra,
  });
}

export async function completeSimpleOrder(
  page: Page,
  mode: WorkMode,
  excludeIds: string[] = [],
): Promise<string> {
  return withTable(page, excludeIds, async (tableId) => {
    await addSimpleProductToCart(page);
    await finishWithTableDetails(page, mode, tableId, 1);
  });
}

export async function completeComplexOrder(
  page: Page,
  mode: WorkMode,
  excludeIds: string[] = [],
): Promise<string> {
  return withTable(page, excludeIds, async (tableId) => {
    await addComplexProductsToCart(page);
    await finishWithTableDetails(page, mode, tableId, 2, {
      observations: [
        observationText(1),
        observationText(2),
        observationText(3),
        observationText(4),
      ],
    });
  });
}

export async function completeObsWithoutExtrasOrder(
  page: Page,
  mode: WorkMode,
  excludeIds: string[] = [],
): Promise<string> {
  return withTable(page, excludeIds, async (tableId) => {
    await addProductWithObsOnly(page, {
      quantity: 2,
      observation: observationText(1),
    });
    await finishWithTableDetails(page, mode, tableId, 3, {
      observations: [observationText(1)],
    });
  });
}

/**
 * @returns tableId, or null when skipped because no extras exist
 */
export async function completeExtrasWithoutObsOrder(
  page: Page,
  mode: WorkMode,
  excludeIds: string[] = [],
): Promise<string | null> {
  const { tableId } = await openTableForOrder(page, { excludeIds });
  const added = await addProductWithExtrasOnly(page);
  if (!added) {
    return null;
  }
  await finishWithTableDetails(page, mode, tableId, 4);
  return tableId;
}

/** @deprecated use completeSimpleOrder */
export async function completeOrderHappyPath(page: Page, mode: WorkMode) {
  await completeSimpleOrder(page, mode);
}
