import { test, expect } from "../regression/POS/harness/pos-fixtures.js";
import { annotateTicket } from "../harness/annotate.js";
import { requirePosCredentials } from "../harness/settings.js";
import { SEED } from "../harness/seed.js";
import { getSessionPath } from "../harness/auth.js";

const TICKET = {
  ws: 'WS-1025',
  tes: 'TES-211',
  release: 'v7.9.1',
  summary: 'POS Cart Duplication',
  addedToRegression: null,
};

test.describe("WS-1025: POS Cart Duplication @release", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);
  test.use({ storageState: getSessionPath("retail") });

  let warnings = [];

  test.beforeEach(async ({ posPage: page }) => {
    warnings = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "warn") {
        warnings.push(msg.text());
      }
    });
  });

  const productName = SEED.products.estandar.name;
  const productCode = SEED.products.estandar.code;

  const getCartItem = (page, name) => {
    return page
      .locator("div.tw-border-l-2.tw-border-secondary")
      .filter({ hasText: name })
      .first();
  };

  const assertCartState = async (page, expectedQuantity) => {
    const cartItem = getCartItem(page, productName);

    await expect(cartItem).toBeVisible({ timeout: 5000 });

    const input = cartItem.locator("input[inputmode='decimal']").first();
    await expect(input).toHaveValue(String(expectedQuantity), { timeout: 5000 });

    const hasDuplication = warnings.some((w) => w.includes("[Duplication]"));
    expect(hasDuplication, "El warn [Duplication] fue disparado — addProductToDetail fue llamado más de una vez").toBe(false);
  };

  const clearCart = async (page) => {
    const clearBtn = page.getByRole("button", { name: /Limpiar Venta/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(
        page.getByText("No hay productos seleccionados")
      ).toBeVisible({ timeout: 5000 });
    }
    warnings = [];
  };

  const searchByCode = async (page, { fast = false } = {}) => {
    const searchInput = page.locator("#searchInput");
    const modeBtnCode = page.getByRole("button", { name: /Código/i }).first();

    if (!(await modeBtnCode.isVisible())) {
      await page.getByRole("button", { name: /Nombre/i }).first().click();
      await expect(modeBtnCode).toBeVisible({ timeout: 5000 });
    }

    await searchInput.click();
    await searchInput.fill(productCode);
    if (!fast) await page.waitForTimeout(300);
    await searchInput.press("Enter");
    if (!fast) await page.waitForTimeout(500);
  };

  const clickCard = async (page, { fast = false } = {}) => {
    const searchInput = page.locator("#searchInput");
    const modeBtnName = page.getByRole("button", { name: /Nombre/i }).first();

    if (!(await modeBtnName.isVisible())) {
      await page.getByRole("button", { name: /Código/i }).first().click();
      await expect(modeBtnName).toBeVisible({ timeout: 5000 });
    }

    await searchInput.click();
    await searchInput.fill(productName);
    if (!fast) await page.waitForTimeout(300);
    await searchInput.press("Enter");

    const card = page.locator(".v-card").filter({ hasText: productName }).first();
    await card.click();
    if (!fast) await page.waitForTimeout(500);
  };

  const clickCartPlus = async (page) => {
    const cartItem = getCartItem(page, productName);

    const plusBtn = cartItem
      .locator("button")
      .filter({ hasText: "+" })
      .or(cartItem.locator("button").filter({ has: page.locator(".mdi-plus") }))
      .first();

    await plusBtn.click();
    await page.waitForTimeout(500);
  };

  const clickCartMinus = async (page) => {
    const cartItem = getCartItem(page, productName);

    const minusBtn = cartItem
      .locator("button")
      .filter({ hasText: /^(-|−)$/ })
      .or(
        cartItem
          .locator("button")
          .filter({ has: page.locator(".mdi-minus") })
      )
      .first();

    await minusBtn.click();
    await page.waitForTimeout(500);
  };

  const setCartManualAmount = async (page, amount) => {
    const cartItem = getCartItem(page, productName);

    const input = cartItem.locator("input[inputmode='decimal']").first();
    await input.click();
    await input.fill(String(amount));
    await input.press("Tab");
    await page.waitForTimeout(500);
  };

  const clickCardBadgePlus = async (page, { fast = false } = {}) => {
    const searchInput = page.locator("#searchInput");
    const modeBtnName = page.getByRole("button", { name: /Nombre/i }).first();

    if (!(await modeBtnName.isVisible())) {
      await page.getByRole("button", { name: /Código/i }).first().click();
      await expect(modeBtnName).toBeVisible({ timeout: 5000 });
    }

    await searchInput.click();
    await searchInput.fill(productName);
    if (!fast) await page.waitForTimeout(300);
    await searchInput.press("Enter");

    const cardWrapper = page
      .locator(".tw-relative")
      .filter({ has: page.getByText(productName) })
      .first();

    const badgeContainer = cardWrapper.locator(".tw-absolute.tw-z-30").first();

    await expect(badgeContainer).toBeVisible({ timeout: 5000 });
    await expect(badgeContainer.locator("button").first()).toBeVisible({
      timeout: 5000,
    });

    const count = await badgeContainer.locator("button").count();

    if (count === 1) {
      await badgeContainer.locator("button").first().click();
      await expect(badgeContainer.locator("button")).toHaveCount(2, {
        timeout: 5000,
      });
    }

    await badgeContainer.locator("button").last().click();
    if (!fast) await page.waitForTimeout(500);
  };

  test("Flow 1: Scanner and interface iteration", async ({ posPage: page }) => {
    test.setTimeout(120_000);
    await searchByCode(page);
    await assertCartState(page, 1);

    await clickCard(page);
    await assertCartState(page, 2);

    await clickCartPlus(page);
    await assertCartState(page, 3);

    await searchByCode(page);
    await assertCartState(page, 4);

    await clearCart(page);
  });

  test("Flow 2: Manual override and increments", async ({ posPage: page }) => {
    test.setTimeout(120_000);
    await clickCard(page);
    await assertCartState(page, 1);

    await setCartManualAmount(page, 5);
    await assertCartState(page, 5);

    await clickCardBadgePlus(page);
    await assertCartState(page, 6);

    await searchByCode(page);
    await assertCartState(page, 7);

    await clearCart(page);
  });

  test("Flow 3: Chaos of sums and subtractions", async ({ posPage: page }) => {
    test.setTimeout(120_000);
    await clickCard(page);
    await assertCartState(page, 1);

    await clickCardBadgePlus(page);
    await assertCartState(page, 2);

    await clickCartMinus(page);
    await assertCartState(page, 1);

    await setCartManualAmount(page, 10);
    await assertCartState(page, 10);

    await clickCard(page);
    await assertCartState(page, 11);

    await clearCart(page);
  });

  test("Flow 4: Rapid fire codes", async ({ posPage: page }) => {
    test.setTimeout(120_000);
    await searchByCode(page);
    await assertCartState(page, 1);

    await searchByCode(page);
    await assertCartState(page, 2);

    await clickCardBadgePlus(page);
    await assertCartState(page, 3);

    await searchByCode(page);
    await assertCartState(page, 4);

    await clearCart(page);
  });

  test("Flow 5: Consecutive scans without delay (scanner race condition)", async ({ posPage: page }) => {
    test.setTimeout(120_000);

    await searchByCode(page, { fast: true });
    await assertCartState(page, 1);

    await searchByCode(page, { fast: true });
    await assertCartState(page, 2);

    await searchByCode(page, { fast: true });
    await assertCartState(page, 3);

    await clearCart(page);
  });

  test("Flow 6: Double-click on badge (rapid badge race condition)", async ({ posPage: page }) => {
    test.setTimeout(120_000);

    await clickCard(page);
    await assertCartState(page, 1);

    await clickCardBadgePlus(page, { fast: true });
    await clickCardBadgePlus(page, { fast: true });
    await assertCartState(page, 3);

    await clearCart(page);
  });

  test("Flow 7: Double-click on product card (rapid card tap)", async ({ posPage: page }) => {
    test.setTimeout(120_000);

    await clickCard(page, { fast: true });
    await assertCartState(page, 1);

    await clickCard(page, { fast: true });
    await assertCartState(page, 2);

    await clearCart(page);
  });

  test("Flow 8: Manual amount set to 0, then re-add via card", async ({ posPage: page }) => {
    test.setTimeout(120_000);

    await clickCard(page);
    await assertCartState(page, 1);

    await setCartManualAmount(page, 0);

    await clickCard(page);
    await assertCartState(page, 1);

    await clearCart(page);
  });

  test("Flow 9: Scanner then badge plus, alternating mechanisms", async ({ posPage: page }) => {
    test.setTimeout(120_000);

    await searchByCode(page);
    await assertCartState(page, 1);

    await clickCardBadgePlus(page);
    await assertCartState(page, 2);

    await searchByCode(page, { fast: true });
    await assertCartState(page, 3);

    await clickCardBadgePlus(page, { fast: true });
    await assertCartState(page, 4);

    await clearCart(page);
  });
});