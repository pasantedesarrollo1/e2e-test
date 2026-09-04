import { expect } from "@playwright/test";

/**
 * Selects a client by cedula in the POS/Admin flows.
 * @param {import('@playwright/test').Page} page
 * @param {string} cedula
 * @param {Object} options
 * @param {boolean} [options.exactCedulaPlaceholder=false] - If true, uses exact string for placeholder (used by POS). Default is false (regex used by Admin).
 * @param {string} [options.typingStrategy='pressSequentially'] - 'pressSequentially' (Admin) or 'fillAndBlur' (POS).
 * @param {string} [options.clientModalSelector='.v-overlay__content:not(.v-snackbar__wrapper)'] - Selector for client modal. Default excludes snackbar (Admin).
 * @param {boolean} [options.strictListboxSelection=true] - If true, verifies listbox visibility and handles Escape (Admin).
 * @param {boolean} [options.useSearchIconBtn=true] - If true, tries to click search icon before falling back to Enter (Admin).
 * @param {boolean} [options.expectModalClosed=true] - If true, softly asserts modal closes after save (Admin).
 * @param {boolean} [options.snackbarRequired=false] - If true, strictly asserts snackbar (POS). If false, uses .catch() (Admin).
 * @param {boolean} [options.assertCedulaOnMain=false] - If true, strictly asserts cedula appears on main page (Admin). Default is false (POS doesn't assert).
 */
export async function selectClientByCedula(page, cedula, options = {}) {
  const {
    exactCedulaPlaceholder = false,
    typingStrategy = 'pressSequentially',
    clientModalSelector = ".v-overlay__content:not(.v-snackbar__wrapper)",
    strictListboxSelection = true,
    useSearchIconBtn = true,
    expectModalClosed = true,
    snackbarRequired = false,
    assertCedulaOnMain = false,
  } = options;

  const cedulaInput = exactCedulaPlaceholder
    ? page.getByPlaceholder("Ingresa Cédula o RUC").first()
    : page.getByPlaceholder(/Ingresa Cédula o RUC/i).first();

  if (typingStrategy === 'pressSequentially') {
    await cedulaInput.click();
    await cedulaInput.clear();
    await cedulaInput.pressSequentially(cedula, { delay: 50 });
    await page.waitForTimeout(300);
    await cedulaInput.press("Enter");
  } else {
    await cedulaInput.clear();
    await cedulaInput.fill(cedula);
    await expect(cedulaInput).toHaveValue(cedula);
    await cedulaInput.blur();
    await page.waitForTimeout(100);
    await cedulaInput.focus();
    await cedulaInput.press("Enter");
  }

  const clientModal = page.locator(clientModalSelector).filter({
    hasText: /Cliente/i,
  }).first();

  try {
    await expect(clientModal).toBeVisible({ timeout: 8000 });
  } catch {}

  if (await clientModal.isVisible()) {
    const alertMessage = clientModal.getByText(/Seleccione un tipo de identificación para continuar/i);
    const saveBtn = clientModal.getByRole("button", { name: /Guardar Cliente/i });
    
    const readyCondition = saveBtn.or(alertMessage);
    await expect(readyCondition).toBeVisible({ timeout: 15000 }).catch(() => {});

    if (await alertMessage.isVisible()) {
      const typeSelect = clientModal.locator(".v-select").first();
      await typeSelect.click({ force: true });
      
      if (strictListboxSelection) {
        const activeListbox = page.locator(".v-overlay-container .v-overlay--active [role='listbox']").first();
        await expect(activeListbox).toBeVisible({ timeout: 5000 });
        
        await activeListbox.getByRole("option", { name: /^CEDULA$/i }).click({ force: true });
        
        if (await activeListbox.isVisible().catch(() => false)) {
          await page.keyboard.press("Escape");
        }
        await expect(activeListbox).not.toBeVisible({ timeout: 5000 });
      } else {
        await page.getByRole("option", { name: /^CEDULA$/i }).click();
      }

      const innerIdInput = clientModal.locator("input").filter({ hasValue: cedula }).first();
      await innerIdInput.focus();
      
      if (useSearchIconBtn) {
        const searchIconBtn = clientModal.locator("button").filter({ has: page.locator(".mdi-magnify") }).first();
        if (await searchIconBtn.isVisible()) {
          await searchIconBtn.click({ force: true });
        } else {
          await innerIdInput.press("Enter");
        }
      } else {
        await innerIdInput.press("Enter");
      }
      
      await page.waitForTimeout(1000); 
    }

    if (await saveBtn.isVisible()) {
      await expect(saveBtn).toBeEnabled({ timeout: 10000 }).catch(() => {});
      await saveBtn.click({ force: true });
      if (expectModalClosed) {
        await expect(clientModal).not.toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    }
  }

  const snackbar = page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i });
  if (snackbarRequired) {
    await expect(snackbar).toBeVisible({ timeout: 15000 });
  } else {
    await expect(snackbar).toBeVisible({ timeout: 15000 }).catch(() => {});
  }

  if (assertCedulaOnMain) {
    await expect(
      page.locator("main").getByText(cedula, { exact: false }).first()
    ).toBeVisible({ timeout: 15000 });
  }
}

