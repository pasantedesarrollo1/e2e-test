import { verifyRecordInList, deleteRecordFromList, saveFormAndVerify } from "../../../../../harness/helpers/crud-helpers.js";
import { withPath } from "../../../../../harness/config/urls.js";
import { ACTION_TOOLTIPS } from "../../../../../harness/helpers/action-tooltips.js";

export async function createSurcharge(page, { name, percentage, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/surcharges/add"));
  await page.getByRole("textbox", { name: /Nombre del recargo/i }).fill(name);
  
  const percentageInput = page.getByPlaceholder("Porcentaje del recargo");
  await percentageInput.fill(String(percentage));
  await percentageInput.press("Tab");
  
  await saveFormAndVerify(page, { endpointPattern: "/api/v1/general/surcharges" });
}

export async function searchSurcharge(page, { name, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/surcharges/list"));
  await verifyRecordInList(page, { searchName: name });
}

export async function deleteSurcharge(page, { name, tenantBaseUrl }) {
  await page.goto(withPath(tenantBaseUrl, "/admin/surcharges/list"));
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/general/surcharges",
    confirmButtonRegex: /^Confirmar$/i,
    deleteTooltip: ACTION_TOOLTIPS.surcharges.delete
  });
}
