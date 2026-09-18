import { type Page } from "@playwright/test";
import { deleteRecordFromList, saveFormAndVerify, verifyRecordInList } from "@/e2e/Wanqara/harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/ui/action-tooltips.js";

export interface CreateBrandOptions {
  name: string;
  order: string | number;
  observation: string;
}

export interface SearchBrandOptions {
  name: string;
}

export async function createBrand(page: Page, { name, order, observation }: CreateBrandOptions): Promise<void> {
  await page.goto("/admin/brands/add");
  await page.getByPlaceholder("Nombre de la Marca").fill(name);
  await page.getByPlaceholder("Orden de la Marca").fill(String(order));
  await page.getByPlaceholder("Observaciones").fill(observation);
  
  await saveFormAndVerify(page, { endpointPattern: "/api/v1/inventory/brands" });
}

export async function searchBrand(page: Page, { name }: SearchBrandOptions): Promise<void> {
  await page.goto("/admin/brands/list");
  await verifyRecordInList(page, { searchName: name });
}


export async function deleteBrand(page: Page, { name }: SearchBrandOptions): Promise<void> {
  await page.goto("/admin/brands/list");
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/inventory/brands",
    confirmButtonRegex: /^Aceptar$/i,
    deleteTooltip: ACTION_TOOLTIPS.brands.delete});
}


