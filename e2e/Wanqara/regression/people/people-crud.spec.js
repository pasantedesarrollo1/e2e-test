import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../harness/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../harness/auth.js";
import { SEED } from "../../harness/seed.js";
import { withPath } from "../../harness/urls.js";
import { searchInList, clickTableRowAction } from "../../harness/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../harness/action-tooltips.js";
import { fillPersonForm, submitPersonForm } from "./harness/people-flow.js";

const tenantBaseUrl = getTenantBaseUrl();

test.describe("People Management CRUD @regression", () => {
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  for (const { label, roles } of SEED.users.crud.roleCases) {
    test(`creates/updates a person as ${label}, verifies, deactivates, and confirms strikethrough`, async ({ page }) => {
      test.setTimeout(120_000);
      const userData = { ...SEED.users.crud, roles };
      const listPath = withPath(tenantBaseUrl, "/admin/people/list");

      await test.step(`Navigate to Add Person and fill form for ${label}`, async () => {
        await ensureAuthenticated(page, {
          tenantBaseUrl,
          targetPath: "/admin/people/add",
          authType: "retail",
        });

        await expect(page.locator("header").filter({ hasText: "100" }).first()).toBeVisible({ timeout: 15000 });
        
        await fillPersonForm(page, userData);
      });

      await test.step("Submit form and verify success response", async () => {
        await submitPersonForm(page);
      });

      await test.step("Return to list, search, and verify user exists", async () => {
        await page.goto(listPath);
        await searchInList(page, userData.identity);
        
        const row = page.locator(".v-data-table__tr").filter({ hasText: userData.identity }).first();
        await expect(row).toBeVisible();
      });

      await test.step("Deactivate the user", async () => {
        const row = page.locator(".v-data-table__tr").filter({ hasText: userData.identity }).first();
        
        await clickTableRowAction(page, row, ACTION_TOOLTIPS.people.delete);

        const confirmBtn = page.getByRole("button", { name: "Confirmar", exact: true });
        
        await Promise.all([
          page.waitForResponse(
            (res) => res.url().includes("/api/v1/general/people/") && res.request().method() === "DELETE" && res.status() === 200
          ),
          confirmBtn.click()
        ]);
        
        await expect(page.locator(".v-snackbar").filter({ hasText: /persona desactivada/i })).toBeVisible();
      });

      await test.step("Search deactivated user and verify strikethrough (CSS line-through)", async () => {
        await searchInList(page, "");
        await searchInList(page, userData.identity);

        const row = page.locator(".v-data-table__tr").filter({ hasText: userData.identity }).first();
        await expect(row).toBeVisible();

        await expect(row).toHaveCSS("text-decoration-line", "line-through");
      });
    });
  }
});