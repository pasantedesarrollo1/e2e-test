import { verifyRecordInList, deleteRecordFromList, saveFormAndVerify } from "../../../../../harness/helpers/crud-helpers.js";
import { withPath } from "../../../../../harness/config/urls.js";
import { expect } from "@playwright/test";

export async function createColor(page, { name, observation, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/colors/add"));
  await page.getByRole("textbox", { name: /Nombre del color/i }).fill(name);
  await page.getByRole("textbox", { name: /Observaci.n del color/i }).fill(observation);
  
  const colorSwatch = page.locator(".v-color-picker-swatches__color > div").first();
  await expect(colorSwatch).toBeVisible();
  await colorSwatch.click();
  
  await saveFormAndVerify(page, { endpointPattern: "/api/v1/general/colors", successMessage: "Color Creado" });
}

export async function searchColor(page, { name, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/colors/list"));
  await verifyRecordInList(page, { searchName: name });
}

export async function deleteColor(page, { name, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/colors/list"));
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/general/colors",
    confirmButtonRegex: /^Aceptar$/i,
    successMessage: "Color Eliminado",
    deleteTooltip: "Eliminar"
  });
}
