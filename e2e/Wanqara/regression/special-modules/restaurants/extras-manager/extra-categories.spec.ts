/* eslint-disable */
interface ExtrasData {
  categoryName: string;
  searchTerm: string;
  productsToAssign: string[];
}
type ScenarioData = AdminScenario & {
  authType: string;
  extrasData: ExtrasData;
}
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { requirePosCredentials } from "@/e2e/Wanqara/harness/config/settings.js";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { testByProductFlow } from "@/e2e/Wanqara/regression/special-modules/restaurants/extras-manager/harness/extras-by-product-helpers.js";
import {
  assignProductsToExtraCategory,
  createExtraCategory,
  deleteExtraCategory,
  verifyDeletionConstraintsAndRemoveProducts
} from "@/e2e/Wanqara/regression/special-modules/restaurants/extras-manager/harness/extras-crud-helpers.js";

import scenariosRaw from "./0-json-data/extra-categories.json" with { type: "json" };
const scenarios = parseScenarios<ScenarioData>(scenariosRaw);

import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type AdminScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

test.describe.serial("Extras Manager - Extra Categories", () => {
  generateDataDrivenTests<ScenarioData>(test, scenarios, (scenario: ScenarioData) => {
    requirePosCredentials(test);

    test(
      scenario.only ? "Ejecuta el flujo completo de categorias extra (focus)" : "Ejecuta el flujo completo de categorias extra",
      { annotation: scenario.only ? { type: "focus", description: "Focused execution via JSON" } : undefined },
      async ({ page }) => {
        test.setTimeout(180_000);
        const { categoryName, searchTerm, productsToAssign } = scenario.extrasData;

        const goToList = async () => {
          await ensureAuthenticated(page, {
            targetPath: "/admin/categories/extras/list",
            authType: scenario.authType});
          await page.waitForLoadState("networkidle");
        };

        await test.step("Step 1: ensures a clean state by removing existing category if present", async () => {
          await goToList();
          
          const categorySearchInput = page.getByPlaceholder(/Buscar categor.a/i);
          await expect(categorySearchInput).toBeVisible();
          await categorySearchInput.fill(categoryName);
           
          await page.waitForTimeout(1000); 

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
          await testByProductFlow(page, categoryName, searchTerm);
        });

      }
    );
  });
});

