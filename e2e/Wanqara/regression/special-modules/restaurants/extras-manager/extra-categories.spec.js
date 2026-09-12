import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/helpers/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/config/settings.js";
import { getSessionPath, ensureAuthenticated } from "../../../../harness/helpers/auth.js";
import { withPath } from "../../../../harness/config/urls.js";

import { 
  createExtraCategory, 
  assignProductsToExtraCategory, 
  verifyDeletionConstraintsAndRemoveProducts, 
  deleteExtraCategory 
} from "./harness/extras-crud-helpers.js";
import { testByProductFlow } from "./harness/extras-by-product-helpers.js";

import scenarios from "./0-json-data/extra-categories.json" assert { type: "json" };

test.describe.serial("Extras Manager - Extra Categories", () => {
  for (const scenario of scenarios) {
    test.describe(`Scenario: ${scenario.description} @${scenario.metadata.testScope}`, () => {
      if (scenario.metadata && scenario.metadata.ws) {
        annotateTicket(test, scenario.metadata);
      }

      if (scenario.skip) {
        test.skip(true, scenario.skipReason);
      }

      requirePosCredentials(test);
      test.use({ storageState: getSessionPath(scenario.authType) });

      test(
        scenario.only ? "Ejecuta el flujo completo de categorias extra (focus)" : "Ejecuta el flujo completo de categorias extra",
        { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
        async ({ page }) => {
          test.setTimeout(180_000);
          const tenantBaseUrl = getTenantBaseUrl();
          const { categoryName, searchTerm, productsToAssign } = scenario.extrasData;

          // Función auxiliar para volver a la lista base
          const goToList = async () => {
            await ensureAuthenticated(page, {
              tenantBaseUrl,
              targetPath: "/admin/categories/extras/list",
              authType: scenario.authType,
            });
            await page.waitForLoadState("networkidle");
          };

          await test.step("Step 1: ensures a clean state by removing existing category if present", async () => {
            await goToList();
            
            const categorySearchInput = page.getByPlaceholder(/Buscar categor.a/i);
            await expect(categorySearchInput).toBeVisible();
            await categorySearchInput.fill(categoryName);
            await page.waitForTimeout(1000); // Wait for search debounce

            const categoryItem = page.getByText(categoryName, { exact: true }).first();
            if (await categoryItem.isVisible()) {
              await categoryItem.click();
              await page.waitForTimeout(1000);
              
              const removeButtons = page.getByRole("button", { name: /Quitar producto/i });
              const count = await removeButtons.count();
              if (count > 0) {
                for (let i = 0; i < count; i++) {
                  await removeButtons.first().click();
                }
                const saveChangesBtn = page.getByRole("button", { name: new RegExp(`Guardar cambios \\(${count}\\)`, "i") });
                const responsePromise = page.waitForResponse(
                  (res) => res.url().includes("/inventory/products/") && res.request().method() === "PUT" && [200, 201].includes(res.status())
                );
                await saveChangesBtn.click();
                await responsePromise;
              }
              await deleteExtraCategory(page);
            }
          });

          await test.step("Step 2: creates a new extra category and assigns products", async () => {
            await goToList();
            await createExtraCategory(page, categoryName);
            await assignProductsToExtraCategory(page, categoryName, searchTerm, productsToAssign);
          });

          await test.step("Step 3: validates deletion constraints when category has associated products", async () => {
            await goToList();
            const categorySearchInput = page.getByPlaceholder(/Buscar categor.a/i);
            await categorySearchInput.fill(categoryName);
            await page.waitForTimeout(1000);
            
            const categoryItem = page.getByText(categoryName, { exact: true }).first();
            await categoryItem.click();
            await page.waitForTimeout(1000);

            await verifyDeletionConstraintsAndRemoveProducts(page);
          });

          await test.step("Step 4: deletes the category and recreates it for subsequent flows", async () => {
            await goToList();
            const categorySearchInput = page.getByPlaceholder(/Buscar categor.a/i);
            await categorySearchInput.fill(categoryName);
            await page.waitForTimeout(1000);
            
            const categoryItem = page.getByText(categoryName, { exact: true }).first();
            await categoryItem.click();
            await page.waitForTimeout(1000);

            await deleteExtraCategory(page);
            await createExtraCategory(page, categoryName);
            await assignProductsToExtraCategory(page, categoryName, searchTerm, productsToAssign);
          });

          await test.step("Step 5: validates 'Por producto' relation flow and cleanup", async () => {
            // El helper testByProductFlow ya hace sus propias navegaciones internas si las necesita.
            await testByProductFlow(page, categoryName, searchTerm);
          });

        }
      );
    });
  }
});
