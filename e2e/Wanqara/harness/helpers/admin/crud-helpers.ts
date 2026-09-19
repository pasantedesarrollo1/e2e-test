import { expect, type Page, type Locator } from "@playwright/test";
import { expectSnackbar, clickAndWaitForApi } from "@/e2e/Wanqara/harness/helpers/admin/ui-helpers.js";

export async function searchInList(page: Page, searchName: string): Promise<void> {
  const searchField = page.getByRole("textbox", { name: /Busca lo que necesites|Buscar por Nombre|Buscar/i }).first();
  await expect(searchField).toBeVisible();
  await searchField.fill(searchName);
}

export interface DeleteRecordOptions {
  searchName: string;
  endpointPattern: string | RegExp;
  confirmButtonRegex?: RegExp;
  successMessage?: string | RegExp;
  deleteTooltip?: string;
}

export async function deleteRecordFromList(page: Page, { searchName, endpointPattern, confirmButtonRegex = /^Aceptar$|^Confirmar$/i, successMessage, deleteTooltip = "Eliminar" }: DeleteRecordOptions): Promise<void> {
  await searchInList(page, searchName);

  const noData = page.getByText("No hay datos disponibles");
  const matchingRow = page.locator(".v-data-table__tr").filter({ hasText: searchName }).first();

  await expect(noData.or(matchingRow)).toBeVisible();

  if (!(await matchingRow.isVisible())) {
    return;
  }

  await clickTableRowAction(page, matchingRow, deleteTooltip);

  const confirmButton = page.getByRole("button", { name: confirmButtonRegex });
  await expect(confirmButton).toBeVisible();

  await clickAndWaitForApi(page, confirmButton, {
    endpoint: endpointPattern,
    method: "DELETE",
    status: 200
  });

  if (successMessage) {
    await expectSnackbar(page, successMessage);
  }
}

export interface SaveFormOptions {
  endpointPattern: string | RegExp;
  successMessage?: string | RegExp;
}

export async function saveFormAndVerify(page: Page, { endpointPattern, successMessage }: SaveFormOptions): Promise<void> {
  const saveButton = page.getByRole("button", { name: /^Guardar$/i }).first();
  await expect(saveButton).toBeVisible();

  await clickAndWaitForApi(page, saveButton, {
    endpoint: endpointPattern,
    method: "POST",
    status: [200, 201]
  });

  if (successMessage) {
    await expectSnackbar(page, successMessage);
  } else {
    await expectSnackbar(page);
  }
}

export interface VerifyRecordOptions {
  searchName: string;
}

export async function verifyRecordInList(page: Page, { searchName }: VerifyRecordOptions): Promise<void> {
  await searchInList(page, searchName);
  const matchingRow = page.locator(".v-data-table__tr").filter({ hasText: searchName }).first();
  await expect(matchingRow).toBeVisible();
}

export async function clickTableRowAction(page: Page, rowLocator: Locator, tooltipText: string): Promise<void> {
  const actionsCell = rowLocator.locator("td").last();

  const isSpeedDial = await actionsCell.locator(".speed-dial-container").count() > 0;
  const hasDotsMenu = await actionsCell.locator(".mdi-dots-vertical, .mdi-dots-horizontal").count() > 0;
  const cellButtons = await actionsCell.locator("button.v-btn").all();
  
  if (isSpeedDial || hasDotsMenu || cellButtons.length === 1) {
    const trigger = actionsCell.locator("button.v-btn").last();
    // We use force: true because Vuetify tooltips/speed dials often overlap the button, failing strict checks.
    // eslint-disable-next-line playwright/no-force-option
    await trigger.click({ force: true });
    // This 'expect' is used intentionally as a soft wait mechanism for the UI overlay to appear.
    // eslint-disable-next-line playwright/no-conditional-expect
    await expect(page.locator(".v-overlay-container .v-overlay--active").first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  }

  const rowButtons = await rowLocator.locator("button.v-btn").all();
  const overlayButtons = await page.locator(".v-overlay-container .v-overlay--active button.v-btn").all();
  
  const buttons = [...rowButtons, ...overlayButtons];
  const foundTooltips: string[] = [];

  for (const btn of buttons) {
    if (!(await btn.isVisible().catch(() => false))) continue;
    if (await btn.isDisabled({ timeout: 500 }).catch(() => true)) continue;

    // eslint-disable-next-line playwright/no-force-option
    await btn.hover({ force: true });

    const tooltip = page
      .locator(".v-overlay__content")
      .filter({ hasText: tooltipText })
      .first();

    try {
      await tooltip.waitFor({ state: "visible", timeout: 600 });
      // eslint-disable-next-line playwright/no-force-option
      await btn.click({ force: true });
      return; 
    } catch {
      const anyTooltip = page.locator(".v-overlay__content").first();
      try {
        const text = await anyTooltip.innerText({ timeout: 200 });
        if (text.trim() && !foundTooltips.includes(text.trim())) {
            foundTooltips.push(text.trim());
        }
      } catch {
        // 
      }
      
      await page.mouse.move(0, 0);
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(100);
      continue;
    }
  }

  for (const btn of buttons) {
    const html = await btn.innerHTML();
    if (tooltipText.toLowerCase().includes("eliminar") && (
      await btn.locator(".mdi-delete, .mdi-trash-can").count() > 0 ||
      html.includes("delete") || html.includes("trash")
    )) {
      // eslint-disable-next-line playwright/no-force-option
      await btn.click({ force: true });
      return;
    }
    if (tooltipText.toLowerCase().includes("ver") && (
      await btn.locator(".mdi-pencil, .mdi-eye, .mdi-details").count() > 0 ||
      html.includes("pencil") || html.includes("edit") || html.includes("details")
    )) {
      // eslint-disable-next-line playwright/no-force-option
      await btn.click({ force: true });
      return;
    }
  }

  throw new Error(
    `No action button with tooltip "${tooltipText}" found in the row. ` +
    `Tooltips found: ${foundTooltips.length ? foundTooltips.join(", ") : "none"}.`
  );
}

export interface EnsureCleanRecordOptions {
  listPath: string;
  addPath: string;
  name: string;
  fillForm: (page: Page) => Promise<void>;
  endpointPattern: string | RegExp;
  successMessage?: string | RegExp;
  confirmButtonRegex?: RegExp;
  deleteSuccessMessage?: string | RegExp;
  deleteTooltip?: string;
}

export async function ensureCleanRecord(page: Page, {
  listPath,
  addPath,
  name,
  fillForm,
  endpointPattern,
  successMessage,
  confirmButtonRegex,
  deleteSuccessMessage,
  deleteTooltip
}: EnsureCleanRecordOptions): Promise<void> {
  await page.goto(listPath);
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern,
    confirmButtonRegex,
    successMessage: deleteSuccessMessage,
    deleteTooltip
  });

  await page.goto(addPath);
  await fillForm(page);

  await saveFormAndVerify(page, { endpointPattern, successMessage });

  await page.goto(listPath);
  await verifyRecordInList(page, { searchName: name });
}
