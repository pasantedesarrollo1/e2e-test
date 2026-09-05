import { expect } from "@playwright/test";
import { selectDropdownOption } from "../../../harness/ui-helpers.js";
export async function fillPersonForm(page, data) {
  await page.getByPlaceholder("Nombre completo").fill(data.name);

  const identityTypeInput = page.getByPlaceholder("Seleccione un tipo de identificación");
  await identityTypeInput.click();
  await page.getByRole("option", { name: new RegExp(`^${data.identityType}$`, "i") }).click();

  const identityInput = page.getByPlaceholder("Ingrese el número de identificación");
  await expect(identityInput).not.toBeDisabled();
  await identityInput.fill(data.identity);

  for (const roleRegex of data.roles) {
    const roleCard = page.locator(".v-card").filter({ hasText: roleRegex }).first();
    await roleCard.click();
  }

  await selectDropdownOption(page, { triggerLocator: page.getByPlaceholder("Provincia") });
  const cityInput = page.getByPlaceholder(/Ciudad/i).first();
  await expect(cityInput).toBeEnabled({ timeout: 5000 });
  await selectDropdownOption(page, { triggerLocator: cityInput });
}

export async function submitPersonForm(page) {
  const saveBtn = page.getByRole("button", { name: "Guardar", exact: true });
  await expect(saveBtn).toBeEnabled();

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/general/people") && res.request().method() === "POST" && res.status() === 200
    ),
    saveBtn.click()
  ]);
}