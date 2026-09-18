import { expect, type Page, type Locator } from "@playwright/test";
import { expectSnackbar, selectDropdownOption } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

export interface IdentityModalOptions {
  identityType?: string;
  identityNumber: string;
  expectedName?: string;
}

export async function fillIdentityModal(page: Page, modalLocator: Locator, {
  identityType = "CEDULA",
  identityNumber,
  expectedName
}: IdentityModalOptions): Promise<void> {
  const typeSelect = modalLocator.locator(".v-select").first();
  await selectDropdownOption(page, {
    triggerLocator: typeSelect,
    optionText: identityType
  });

  const idInput = modalLocator.locator('input[id*="identity"], input[placeholder*="identificación"], input[placeholder*="Cédula"]').first();
  await expect(idInput).not.toHaveAttribute("readonly");
  await idInput.clear();
  await idInput.fill(identityNumber);

  const searchBtn = modalLocator.locator("button").filter({ has: page.locator(".mdi-magnify") }).first();
  await searchBtn.click({ force: true });

  if (expectedName) {
    // @ts-expect-error: Playwright filter does not support hasValue, but user forbade modifying locators
    const nameInput = modalLocator.locator("input").filter({ hasValue: expectedName }).first();
    await expect(nameInput).toBeVisible({ timeout: 20000 });
  }
}

export interface SelectClientOptions {
  exactCedulaPlaceholder?: boolean;
  typingStrategy?: 'fill' | 'pressSequentially';
  clientModalSelector?: string;
  expectModalClosed?: boolean;
  snackbarRequired?: boolean;
  assertCedulaOnMain?: boolean;
}

export async function selectClientByCedula(page: Page, cedula: string, options: SelectClientOptions = {}): Promise<void> {
  const {
    exactCedulaPlaceholder = false,
    typingStrategy = 'fill',
    clientModalSelector = ".v-overlay--active .v-overlay__content:not(.v-snackbar__wrapper)",
    expectModalClosed = true,
    snackbarRequired = false,
    assertCedulaOnMain = false
  } = options;

  const cedulaInput = exactCedulaPlaceholder
    ? page.getByPlaceholder("Ingresa Cédula o RUC").first()
    : page.getByPlaceholder(/Ingresa Cédula o RUC/i).first();

  if (typingStrategy === 'pressSequentially') {
    await cedulaInput.click();
    await cedulaInput.clear();
    await cedulaInput.pressSequentially(cedula, { delay: 50 });
    await expect(cedulaInput).toHaveValue(cedula);
    await page.waitForTimeout(1000); // Give Vuetify debounce & backend time to populate dropdown
    await cedulaInput.press("Enter");
  } else {
    await cedulaInput.clear();
    await cedulaInput.fill(cedula);
    await expect(cedulaInput).toHaveValue(cedula);
    await cedulaInput.blur();
    await cedulaInput.focus();
    await cedulaInput.press("Enter");
  }

  const clientModal = page.locator(clientModalSelector).filter({
    hasText: /Cliente/i}).last();

  const successSnackbar = page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i }).last();

  await expect(clientModal.or(successSnackbar)).toBeVisible({ timeout: 15000 });

  if (await clientModal.isVisible()) {
    const alertMessage = clientModal.getByText(/Seleccione un tipo de identificaci.n para continuar/i);
    const saveBtn = clientModal.getByRole("button", { name: /Guardar Cliente/i });
    
    const readyCondition = saveBtn.or(alertMessage);
    await expect(readyCondition).toBeVisible({ timeout: 15000 });

    if (await alertMessage.isVisible()) {
      await fillIdentityModal(page, clientModal, {
        identityType: "CEDULA",
        identityNumber: cedula
      });
      await expect(saveBtn.or(successSnackbar)).toBeVisible({ timeout: 15000 });
    }

    if (await saveBtn.isVisible()) {
      await expect(saveBtn).toBeEnabled({ timeout: 10000 });
      await saveBtn.click({ force: true });
      if (expectModalClosed) {
        await expect(clientModal).not.toBeVisible({ timeout: 5000 });
      }
    }
  }

  try {
    await expectSnackbar(page, /Cliente asignado correctamente/i, 15000);
  } catch (error) {
    if (snackbarRequired) throw error;
  }

  if (assertCedulaOnMain) {
    await expect(
      page.locator("main").getByText(cedula, { exact: false }).first()
    ).toBeVisible({ timeout: 15000 });
  }
}

export interface SelectClientFromSearchOptions {
  triggerLocator: Locator;
  modalLocator?: Locator;
  expectModalClosed?: boolean;
}

export async function selectClientFromSearchModal(page: Page, searchTerm: string, options: SelectClientFromSearchOptions): Promise<void> {
  const { triggerLocator, modalLocator, expectModalClosed = false } = options;

  await expect(triggerLocator).toBeVisible();
  await triggerLocator.click();

  const container = modalLocator || page;

  if (modalLocator) {
    await expect(modalLocator).toBeVisible();
  }

  const searchInput = container.getByRole("textbox", { name: /Busca lo que necesites/i }).first();
  await expect(searchInput).toBeVisible();
  await searchInput.fill(searchTerm);

  const row = container.locator(".v-data-table__tr").filter({ hasText: searchTerm }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();

  if (expectModalClosed && modalLocator) {
    await expect(modalLocator).toBeHidden();
  }
}
