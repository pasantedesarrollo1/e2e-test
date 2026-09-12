import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../harness/config/settings.js";
import { getSessionPath } from "../../../harness/helpers/auth.js";
import { ensureAuthenticated } from "../../../harness/helpers/auth.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "cart-duplication.json"), "utf-8")
);

test.describe("POS Retail — Cart Duplication @regression", () => {
  test.describe.configure({ mode: 'default' });

  if (scenarios.length > 0) {
    annotateTicket(test, scenarios[0].metadata);
  }

  for (const scenario of scenarios) {
    test.describe(scenario.description, () => {
      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test("Execute Flow", async ({ page }) => {
        test.setTimeout(120_000);

        const tenantBaseUrl = getTenantBaseUrl();
        const targetPath = "/pos/home";
        
        await ensureAuthenticated(page, {
          tenantBaseUrl,
          targetPath,
          authType: scenario.authType,
        });

      let warnings = [];
      page.on("console", (msg) => {
        if (msg.type() === "warning" || msg.type() === "warn") {
          warnings.push(msg.text());
        }
      });

      const productName = scenario.productName;
      const productCode = scenario.productCode;

      const getCartItem = (page, name) => {
        return page
          .locator("div.tw-border-l-2.tw-border-secondary")
          .filter({ hasText: name })
          .first();
      };

      const assertCartState = async (page, expectedQuantity) => {
        if (expectedQuantity === undefined) return;
        
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

      const actionHandlers = {
        searchByCode: async (page, action) => {
          const searchInput = page.locator("#searchInput");
          const modeBtnCode = page.getByRole("button", { name: /Código/i }).first();
          if (!(await modeBtnCode.isVisible())) {
            await page.getByRole("button", { name: /Nombre/i }).first().click();
            await expect(modeBtnCode).toBeVisible({ timeout: 5000 });
          }
          await searchInput.click();
          await searchInput.fill(productCode);
          await searchInput.press("Enter");
        },
        clickCard: async (page, action) => {
          const searchInput = page.locator("#searchInput");
          await expect(searchInput).toBeVisible({ timeout: 10000 });
          const modeBtnName = page.getByRole("button", { name: /Nombre/i }).first();
          if (!(await modeBtnName.isVisible())) {
            await page.getByRole("button", { name: /Código/i }).first().click();
            await expect(modeBtnName).toBeVisible({ timeout: 5000 });
          }
          await searchInput.click();
          await searchInput.fill(productName);
          await searchInput.press("Enter");
          const card = page.locator(".v-card").filter({ hasText: productName }).first();
          await card.click();
        },
        clickCartPlus: async (page, action) => {
          const cartItem = getCartItem(page, productName);
          const plusBtn = cartItem
            .locator("button")
            .filter({ hasText: "+" })
            .or(cartItem.locator("button").filter({ has: page.locator(".mdi-plus") }))
            .first();
          await plusBtn.click();
        },
        clickCartMinus: async (page, action) => {
          const cartItem = getCartItem(page, productName);
          const minusBtn = cartItem
            .locator("button")
            .filter({ hasText: /^(-\|−)$/ })
            .or(cartItem.locator("button").filter({ has: page.locator(".mdi-minus") }))
            .first();
          await minusBtn.click();
        },
        setCartManualAmount: async (page, action) => {
          const cartItem = getCartItem(page, productName);
          const input = cartItem.locator("input[inputmode='decimal']").first();
          await input.click();
          await input.fill(String(action.amount));
          await input.press("Tab");
        },
        clickCardBadgePlus: async (page, action) => {
            const searchInput = page.locator("#searchInput");
            await expect(searchInput).toBeVisible({ timeout: 10000 });
            const modeBtnName = page.getByRole("button", { name: /Nombre/i }).first();
            if (!(await modeBtnName.isVisible())) {
              await page.getByRole("button", { name: /Código/i }).first().click();
              await expect(modeBtnName).toBeVisible({ timeout: 5000 });
            }
            await searchInput.click();
            await searchInput.fill(productName);
            await searchInput.press("Enter");
            
            const cardWrapper = page
              .locator(".tw-relative")
              .filter({ has: page.getByText(productName) })
              .first();
              
            const badgeContainer = cardWrapper.locator(".tw-absolute.tw-z-30").first();
            
            await badgeContainer.locator("button").first().click();
            await expect(badgeContainer.locator("button")).toHaveCount(2, { timeout: 5000 });
            await badgeContainer.locator("button").last().click();
          }
      };

      for (const action of scenario.actions) {
        if (!actionHandlers[action.type]) {
          throw new Error(`Unknown action type: ${action.type}`);
        }
        await actionHandlers[action.type](page, action);
        
        if (action.expectedQuantity !== undefined) {
           await assertCartState(page, action.expectedQuantity);
        }
      }
      
      await clearCart(page);
    });
  });
}
});
