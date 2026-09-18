import { expect, type Page, type Locator } from "@playwright/test";
import { ensureAuthenticated } from "@/e2e/Wanqara/harness/helpers/auth/auth.js";
import { searchInList } from "@/e2e/Wanqara/harness/helpers/crud/crud-helpers.js";
import { fillIdentityModal } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { expectSnackbar, selectDropdownOption } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

export type CarrierMethod = "cedula" | "selector" | "form";

export interface CarrierCase {
  label: string;
  carrier: CarrierMethod;
}

export const CARRIER_CASES: CarrierCase[] = [
  { label: "por cédula",                 carrier: "cedula"   },
  { label: "por selector",               carrier: "selector" },
  { label: "por formulario de empleado", carrier: "form"     },
];

async function fillInput(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.getByPlaceholder(placeholder).first();
  await input.fill(value);
  await input.press("Tab");
}

export interface TransporterInfo {
  cedula: string;
  identityType?: string;
  identity?: string;
  name?: string;
}

export async function assignCarrier(page: Page, carrier: CarrierMethod, carrierParams: TransporterInfo): Promise<void> {
  if (!carrierParams) throw new Error("assignCarrier requires carrierParams");
  const { cedula, identityType, identity, name } = carrierParams;

  if (carrier === "cedula") {
    await searchCarrierByCedula(page, cedula);
    await verifyAndSaveCarrierModal(page, {
      expectedIdentityType: identityType!,
      expectedIdentity:     identity!,
      expectedName:         name!
    });
    return;
  }

  if (carrier === "selector") {
    await openCarrierSelectorAndSelect(page, cedula);
    return;
  }

  await addCarrierViaEmployeeForm(page, {
    identityType: identityType!,
    identity:     identity!,
    expectedName: name!
  });
}

export interface OpenWaybillDialogOptions {
  authType: string;
}

export async function openAddWaybillDialog(page: Page, { authType }: OpenWaybillDialogOptions): Promise<Locator> {
  if (!authType) throw new Error("openAddWaybillDialog requires authType");
  await ensureAuthenticated(page, { targetPath: "/admin/waybills/list", authType });
  await expect(page).toHaveURL(/\/admin\/waybills\/list/);

  const addBtn = page.getByRole("button", { name: /Agregar Guía/i }).first();
  await addBtn.click();

  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Nueva guía de remisión/i }).first();
  await expect(dialog).toBeVisible();

  return dialog;
}

export async function selectWaybillTypeAndContinue(page: Page, dialog: Locator, type: "internal" | "external" = "internal"): Promise<void> {
  await dialog.locator("div[role='radiogroup'] .v-card")
    .filter({ hasText: type === "internal" ? /Interna/i : /Externa/i })
    .first()
    .click();

  const continueBtn = dialog.getByRole("button", { name: /Continuar/i });
  await continueBtn.click();

  await page.waitForURL(/\/admin\/waybills\/add/);
}

export interface WaybillDates {
  startDate?: Date | string;
  finishDate?: Date | string;
}

export async function fillWaybillDates(page: Page, { startDate, finishDate }: WaybillDates): Promise<void> {
  const fmt = (d: Date | string | undefined): string => {
    if (!d) return "";
    if (typeof d === "string") return d;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const startStr  = fmt(startDate);
  const finishStr = fmt(finishDate);

  const startInput = page.locator("div").filter({ hasText: /^Fecha de inicio/ }).locator("input").first();
  await startInput.clear();
  await startInput.fill(startStr);
  await startInput.press("Tab");

  const finishInput = page.locator("div").filter({ hasText: /^Fecha de finalización/ }).locator("input").first();
  await finishInput.clear();
  await finishInput.fill(finishStr);
  await finishInput.press("Tab");
}

export async function selectWarehouse(page: Page, warehouseName: string): Promise<void> {
  await selectDropdownOption(page, {
    triggerLocator: page.getByRole("combobox", { name: "Seleccione una bodega" }),
    optionText: warehouseName
  });
}

export async function selectCheckout(page: Page, checkoutName: string): Promise<void> {
  await selectDropdownOption(page, {
    triggerLocator: page.getByRole("combobox", { name: "Seleccione un Punto de Venta" }),
    optionText: checkoutName
  });
}

export async function fillVehiclePlate(page: Page, plate: string): Promise<void> {
  await fillInput(page, "Ingrese la placa del vehiculo", plate);
}

export async function searchCarrierByCedula(page: Page, cedula: string): Promise<void> {
  const carrierInput = page.getByPlaceholder("Ingresa Cédula o RUC").first();
  await carrierInput.fill(cedula);

  const carrierField = page.locator(".v-text-field").filter({ has: carrierInput }).first();
  const searchBtn = carrierField.locator("button").last();
  await searchBtn.click();
}

export interface VerifyCarrierModalOptions {
  expectedIdentityType: string;
  expectedIdentity: string;
  expectedName: string;
}

export async function verifyAndSaveCarrierModal(page: Page, {
  expectedIdentityType,
  expectedIdentity,
  expectedName
}: VerifyCarrierModalOptions): Promise<void> {
  const dialog = page.locator(".v-dialog").filter({ hasText: /Agregar Empleado/i }).first();

  await expect(dialog.locator(".v-select").filter({ hasText: expectedIdentityType }).first()).toBeVisible();
  await expect(dialog.locator("#employee-identity-input")).toHaveValue(expectedIdentity);

  const nameInput = dialog.locator(".v-card-text input").first();
  await expect(nameInput).toHaveValue(expectedName);

  const saveBtn = dialog.getByRole("button", { name: /Guardar Empleado/i });
  await saveBtn.click();

  await expect(dialog).toBeHidden();
}

export interface InternalWaybillData extends WaybillDates {
  authType: string;
  warehouseName: string;
  checkoutName: string;
}

export async function fillInternalWaybillForm(page: Page, {
  authType,
  startDate,
  finishDate,
  warehouseName,
  checkoutName
}: InternalWaybillData): Promise<void> {
  const today = new Date();

  const dialog = await openAddWaybillDialog(page, { authType });
  await selectWaybillTypeAndContinue(page, dialog, "internal");

  await fillWaybillDates(page, {
    startDate:  startDate  ?? today,
    finishDate: finishDate ?? today
  });

  await selectWarehouse(page, warehouseName);
  await selectCheckout(page, checkoutName);
}

export interface DispatchDetails {
  address: string;
  reason: string;
  route: string;
  destinationSubsidiary?: boolean | string;
}

export async function fillAddressDetails(page: Page, { address, reason, route, destinationSubsidiary }: DispatchDetails): Promise<void> {
  await fillInput(page, "Ingrese la dirección completa", address);
  await fillInput(page, "Ingrese la razón de la entrega", reason);
  await fillInput(page, "Ingrese la ruta de la entrega", route);

  if (destinationSubsidiary) {
    const subsidiaryAutocomplete = page.getByRole("combobox", { name: "Seleccione Sucursal Destino" });
    await selectDropdownOption(page, { triggerLocator: subsidiaryAutocomplete });
  }
}

export async function searchAndSelectShipmentProduct(page: Page, productName: string): Promise<void> {
  const searchInput = page.locator("#searchInput").first();
  await searchInput.fill(productName);

  const productCard = page.locator(".v-virtual-scroll .v-card").filter({ hasText: productName }).first();
  await productCard.click();

  await expect(page.locator(".v-card").filter({ hasText: /seleccionado/i }).first()).toBeVisible();
}

export async function fillShipmentAmount(page: Page, amount: number | string): Promise<void> {
  await fillInput(page, "Ingrese la cantidad a enviar", String(amount));
}

export async function submitWaybillAndVerify(page: Page): Promise<void> {
  const saveBtn = page.getByRole("button", { name: /Guardar/i }).filter({ hasText: /Guardar/i }).first();
  const [response] = await Promise.all([
    page.waitForResponse(res => 
      res.url().includes('/api/v2/billing/waybills') && 
      res.request().method() === 'POST' && 
      res.status() === 201
    ),
    saveBtn.click({ force: true })
  ]);

  await expectSnackbar(page, /Proceso realizado correctamente/i);
  
  await expect(page).toHaveURL(/\/admin\/waybills\/list/);

  const responseData = await response.json() as { data?: { sequence?: string; number?: string; documentNumber?: string } };
  const fullWaybillNumber = responseData.data?.sequence || responseData.data?.number || responseData.data?.documentNumber;

  if (fullWaybillNumber && typeof fullWaybillNumber === 'string') {
    const sequentialNumber = fullWaybillNumber.split('-').pop();
    if (sequentialNumber) {
      await searchInList(page, sequentialNumber);
      const row = page.locator(".v-data-table__tr").filter({ hasText: sequentialNumber }).first();
      await expect(row).toBeVisible();
    }
  }
}

export async function openCarrierSelectorAndSelect(page: Page, searchTerm: string): Promise<void> {
  const selectorBtn = page.locator(".v-text-field:has(input[placeholder='Ingresa Cédula o RUC']) + button").first();
  await selectorBtn.click();

  const dialog = page.locator(".v-overlay__content").filter({ hasText: /Busca lo que necesites/i }).first();
  
  const searchInput = dialog.getByRole("textbox").first();
  await searchInput.fill(searchTerm);

  const firstRow = dialog.locator(".v-data-table__tr").filter({ hasText: searchTerm }).first();
  await expect(firstRow).toBeVisible();
  await firstRow.click();

  await expect(dialog).toBeHidden();
}

export interface AddCarrierFormOptions {
  identityType: string;
  identity: string;
  expectedName: string;
}

export async function addCarrierViaEmployeeForm(page: Page, {
  identityType,
  identity,
  expectedName
}: AddCarrierFormOptions): Promise<void> {
  const carrierInput = page.getByPlaceholder("Ingresa Cédula o RUC").first();
  const carrierField = page.locator(".v-text-field").filter({ has: carrierInput }).first();
  
  const searchBtn = carrierField.locator("button").last();
  await searchBtn.click();

  const dialog = page.locator(".v-dialog").filter({ hasText: /Agregar Empleado/i }).first();

  await fillIdentityModal(page, dialog, {
    identityType,
    identityNumber: identity,
    expectedName
  });

  const saveBtn = dialog.getByRole("button", { name: /Guardar Empleado/i });
  await saveBtn.click();

  await expect(dialog).toBeHidden();
}

export async function selectSaleFromModal(page: Page, index = 0): Promise<void> {
  const selectSaleBtn = page.getByRole("button", { name: /Seleccionar venta/i }).first();
  await selectSaleBtn.click();

  const modal = page.locator(".v-overlay__content").filter({ hasText: /Ventas Electrónicas Autorizadas/i }).first();
  await expect(modal).toBeVisible();

  const row = modal.locator(".v-data-table__tr").nth(index);
  await row.click();

  await expect(modal).toBeHidden();
}

export interface ExternalWaybillData extends WaybillDates {
  authType: string;
  checkoutName: string;
  saleIndex?: number;
}

export async function fillExternalWaybillForm(page: Page, {
  authType,
  startDate,
  finishDate,
  checkoutName,
  saleIndex = 0
}: ExternalWaybillData): Promise<void> {
  const today = new Date();

  const dialog = await openAddWaybillDialog(page, { authType });
  await selectWaybillTypeAndContinue(page, dialog, "external");

  await selectSaleFromModal(page, saleIndex);

  await fillWaybillDates(page, {
    startDate:  startDate  ?? today,
    finishDate: finishDate ?? today
  });

  await selectCheckout(page, checkoutName);
}

export async function selectFirstAvailableShipmentProductFromSale(page: Page): Promise<void> {
  const productField = page.locator('.v-autocomplete').last().locator('.v-field').first();

  try {
    await selectDropdownOption(page, { triggerLocator: productField });
  } catch (error) {
    throw new Error("The dropdown opened, but it is empty. The selected sale has no remaining quantity available for shipment.", { cause: error });
  }
}

export async function clearAssignedCarrierAndVerify(page: Page): Promise<void> {
    const clearBtn = page.locator(".tw-flex > .tw-flex.tw-gap-1").getByRole("button").last();
    await clearBtn.click();
    await page.getByText(/Empleado Test 1.*Identificaci.n:/i).waitFor({ state: "hidden" });
}

export async function expectCarrierAssigned(page: Page): Promise<void> {
    await expect(page.getByText(/Empleado Test 1.*Identificaci.n:/i)).toBeVisible();
}
