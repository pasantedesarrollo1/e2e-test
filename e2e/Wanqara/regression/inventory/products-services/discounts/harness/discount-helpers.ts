import { expect, type Page } from "@playwright/test";
import {
  deleteRecordFromList,
  saveFormAndVerify,
  verifyRecordInList
} from "@/e2e/Wanqara/harness/helpers/crud/crud-helpers.js";
import { ACTION_TOOLTIPS } from "@/e2e/Wanqara/harness/helpers/ui/action-tooltips.js";

export type ApplicationMethod = "always" | "every_to" | "from_to";
export type DiscountType = "porcentaje" | "fijo";

export interface DiscountPayload {
  name: string;
  description?: string;
  applicationMethod: ApplicationMethod;
  type: DiscountType;
  discount: number | string;
  quantity?: number | string;
}

export async function fillDiscountForm(page: Page, {
  name,
  description,
  applicationMethod,
  type,
  discount,
  quantity
}: DiscountPayload): Promise<void> {
  await page.goto("/admin/discounts/add");
  await expect(page).not.toHaveURL(/\/login(\/|$)/);

  await page.getByRole("textbox", { name: /Nombre del descuento/i }).fill(name);

  if (description) {
    await page.locator("#description").fill(description);
  }

  const methodLabel = {
    always:   "Siempre",
    every_to: "Por Cada",
    from_to:  "A partir de"
  }[applicationMethod];

  const methodField = page.locator(".v-field").filter({
    has: page.locator("input[placeholder='Selecciona el método de aplicación']")
  });
  await methodField.locator(".v-field__append-inner").click();
  await page.getByRole("option", { name: new RegExp(methodLabel) }).first().click();

  const typeLabel = type === "porcentaje" ? "Porcentaje" : "Fijo";
  const typeField = page.locator(".v-field").filter({
    has: page.locator("input[placeholder='Selecciona el tipo de descuento']")
  });
  await typeField.locator(".v-field__append-inner").click();
  await page.getByRole("option", { name: new RegExp(typeLabel) }).first().click();

  await page.getByPlaceholder("Valor del descuento").fill(String(discount));
  await page.getByPlaceholder("Valor del descuento").press("Tab");

  if (applicationMethod !== "always") {
    if (!quantity) throw new Error("quantity is required for methods other than always");
    await expect(page.getByPlaceholder("Cantidad cuando se aplica")).toBeVisible();
    await page.getByPlaceholder("Cantidad cuando se aplica").fill(String(quantity));
    await page.getByPlaceholder("Cantidad cuando se aplica").press("Tab");
  }

  const startInput = page.getByRole("textbox", { name: /Fecha de Inicio/i });
  await startInput.click();
  await page.getByRole("button", { name: /Hoy/i }).first().click();

  const endInput = page.getByRole("textbox", { name: /Fecha de Fin/i });
  await endInput.click();
  await page.getByRole("button", { name: /Hoy/i }).first().click();

  await page.locator("span").filter({ hasText: /^Seleccionar todos$/ }).click();
}

export async function assertDiscountSummary(page: Page, { applicationMethod, type, discount, quantity }: Pick<DiscountPayload, "applicationMethod" | "type" | "discount" | "quantity">): Promise<void> {
  const summaryCard = page.locator(".v-card").filter({ hasText: /Resumen de Descuento/i }).first();
  await expect(summaryCard).toBeVisible();

  const summaryText = summaryCard.locator(".tw-text-sm.tw-mt-2.tw-font-semibold");

  if (applicationMethod === "always") {
    await expect(summaryCard.locator("strong").filter({ hasText: /Siempre/i })).toBeVisible();
  } else if (applicationMethod === "every_to") {
    await expect(summaryCard.locator("strong").filter({ hasText: /Por Cada/i })).toBeVisible();
    await expect(summaryText.locator("span").filter({ hasText: new RegExp(`^${quantity}$`) })).toBeVisible();
  } else if (applicationMethod === "from_to") {
    await expect(summaryCard.locator("strong").filter({ hasText: /A partir de/i })).toBeVisible();
    await expect(summaryText.locator("span").filter({ hasText: new RegExp(`^${quantity}$`) })).toBeVisible();
  }

  if (type === "porcentaje") {
    await expect(summaryCard.locator("strong").filter({ hasText: /Porcentaje/i })).toBeVisible();
    await expect(summaryText.locator("span").filter({ hasText: new RegExp(`^${discount}%$`) })).toBeVisible();
  } else {
    await expect(summaryCard.locator("strong").filter({ hasText: /Fijo/i })).toBeVisible();
    await expect(summaryText.locator("span").filter({ hasText: new RegExp(`^\\$${discount}$`) })).toBeVisible();
  }
}

export async function saveDiscount(page: Page): Promise<void> {
  await saveFormAndVerify(page, {
    endpointPattern: "/api/v1/inventory/discounts",
    successMessage: "Descuento creado exitosamente"
  });
}

export async function createDiscount(page: Page, payload: DiscountPayload): Promise<void> {
  await fillDiscountForm(page, payload);
  await saveDiscount(page);
}

export interface SearchDiscountOptions {
  name: string;
}

export async function searchDiscount(page: Page, { name }: SearchDiscountOptions): Promise<void> {
  await page.goto("/admin/discounts/list");
  await expect(page).not.toHaveURL(/\/login(\/|$)/);

  await verifyRecordInList(page, { searchName: name });
}

export async function deleteDiscount(page: Page, { name }: SearchDiscountOptions): Promise<void> {
  await page.goto("/admin/discounts/list");
  await expect(page).not.toHaveURL(/\/login(\/|$)/);

  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern: "/api/v1/inventory/discounts/",
    confirmButtonRegex: /^Confirmar$/i,
    deleteTooltip: ACTION_TOOLTIPS.discounts.delete
  });
}
