import { deleteRecordFromList, saveFormAndVerify, verifyRecordInList } from "../../../../../harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "../../../../../harness/helpers/ui/action-tooltips.js";

export async function createBrand(page, { name, order, observation }) {
  await page.goto("/admin/brands/add");
  await page.getByPlaceholder("Nombre de la Marca").fill(name);
  await page.getByPlaceholder("Orden de la Marca").fill(order);
  await page.getByPlaceholder("Observaciones").fill(observation);
  
  await saveFormAndVerify(page, { endpointPattern: "/api/v1/inventory/brands" });
}

export async function searchBrand(page, { name }) {
  await page.goto("/admin/brands/list");
  await verifyRecordInList(page, { searchName: name });
}


export async function deleteBrand(page, { name }) {
  await page.goto("/admin/brands/list");
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/inventory/brands",
    confirmButtonRegex: /^Aceptar$/i,
    deleteTooltip: ACTION_TOOLTIPS.brands.delete});
}


