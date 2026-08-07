import { expect } from "@playwright/test";
import { withPath } from "./urls.js";
import { SEED } from "./seed.js";

export async function configureTenantForAuthType(page, { tenantBaseUrl, authType }) {
  const isRestaurant = authType === "restaurant";
  const needsDispatch = authType === "dispatch";
  const subsidiaryName = SEED.subsidiaries[authType].name;

  await page.goto(withPath(tenantBaseUrl, "/admin/subsidiaries/list"));
  await expect(page).not.toHaveURL(/\/login(\/|$)/);

  const searchBox = page.getByRole('textbox', { name: /Busca lo que necesites/i }).first();
  await expect(searchBox).toBeVisible();
  await searchBox.click();
  await searchBox.fill(subsidiaryName);
  
  const sucursalRow = page.locator(".v-data-table__tr").filter({ hasText: new RegExp(subsidiaryName, 'i') }).first();
  await expect(sucursalRow).toBeVisible();
  
  const viewButton = sucursalRow.locator('td').last().locator('button').first();
  await expect(viewButton).toBeVisible();
  await viewButton.click();
  
  let hasChanges = false;
  
  const editButton = page.getByRole('button', { name: /^Editar$/i });
  const saveButton = page.getByRole('button', { name: /^Guardar$/i });

  const commerceOption = page.locator("div[style*='min-width: 90px']").filter({ hasText: /^Comercios$/i }).first();
  const restaurantOption = page.locator("div[style*='min-width: 90px']").filter({ hasText: /Restaurante/i }).first();
  
  const targetOption = isRestaurant ? restaurantOption : commerceOption;
  await expect(targetOption).toBeVisible();
  const isAlreadyCorrectType = await targetOption.evaluate((el) => el.classList.contains("tw-border-primary"));

  const dispatchContainer = page.locator("div").filter({ hasText: /^Despacho posterior/ }).filter({ has: page.locator(".v-switch") }).first();
  const switchInput = dispatchContainer.locator("input[type='checkbox']");
  const isDispatchChecked = await switchInput.isVisible() ? await switchInput.isChecked() : false; 
  const needsDispatchChange = !isRestaurant && (needsDispatch !== isDispatchChecked);

  if (!isAlreadyCorrectType || needsDispatchChange) {
    hasChanges = true;
    
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    if (!isAlreadyCorrectType) {
      await targetOption.click();
      await expect(targetOption).toHaveClass(/tw-border-primary/);
    }

    if (needsDispatchChange && !isRestaurant) {
      await dispatchContainer.locator(".v-switch").click();
      if (needsDispatch) {
        await expect(switchInput).toBeChecked();
      } else {
        await expect(switchInput).not.toBeChecked();
      }
    }

    await saveButton.click();

    await page.getByText('Declaro que he revisado esta').click();
    await page.getByRole('button', { name: 'Confirmar y actualizar' }).click();
    await page.getByRole('button', { name: 'Entendido' }).click();
  }

  return hasChanges;
}