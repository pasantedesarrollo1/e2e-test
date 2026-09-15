import { deleteRecordFromList, saveFormAndVerify, verifyRecordInList } from "../../../../../harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../../harness/helpers/ui/action-tooltips.js";

export async function createSize(page, { name, observation }) {
  await page.goto("/admin/sizes/add");
  await page.getByRole("textbox", { name: /Nombre de la Talla/i }).fill(name);
  await page.getByRole("textbox", { name: /Observación de la talla/i }).fill(observation);
  
  await saveFormAndVerify(page, { endpointPattern: "/api/v1/general/sizes", successMessage: "Talla Creada" });
}

export async function searchSize(page, { name }) {
  await page.goto("/admin/sizes/list");
  await verifyRecordInList(page, { searchName: name });
}

export async function deleteSize(page, { name }) {
  await page.goto("/admin/sizes/list");
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/general/sizes",
    confirmButtonRegex: /^Aceptar$/i,
    successMessage: "Talla Eliminada",
    deleteTooltip: ACTION_TOOLTIPS.sizes.delete
  });
}
