import { expect } from "@playwright/test";
import { deleteRecordFromList, saveFormAndVerify, verifyRecordInList } from "../../../../../harness/helpers/crud/crud-helpers.js";

export async function createColor(page, { name, observation }) {
  await page.goto("/admin/colors/add");
  await page.getByRole("textbox", { name: /Nombre del color/i }).fill(name);
  await page.getByRole("textbox", { name: /Observaci.n del color/i }).fill(observation);
  
  const colorSwatch = page.locator(".v-color-picker-swatches__color > div").first();
  await expect(colorSwatch).toBeVisible();
  await colorSwatch.click();
  
  await saveFormAndVerify(page, { endpointPattern: "/api/v1/general/colors", successMessage: "Color Creado" });
}

export async function searchColor(page, { name }) {
  await page.goto("/admin/colors/list");
  await verifyRecordInList(page, { searchName: name });
}

export async function deleteColor(page, { name }) {
  await page.goto("/admin/colors/list");
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/general/colors",
    confirmButtonRegex: /^Aceptar$/i,
    successMessage: "Color Eliminado",
    deleteTooltip: "Eliminar"
  });
}
