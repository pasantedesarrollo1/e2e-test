import { expect } from "@playwright/test";

export async function searchInList(page, searchName) {
  const searchField = page.getByRole("textbox", { name: /Busca lo que necesites|Buscar por Nombre/i }).first();
  await expect(searchField).toBeVisible();
  await searchField.fill(searchName);
}

export async function deleteRecordFromList(page, { searchName, endpointPattern, confirmButtonRegex = /^Aceptar$|^Confirmar$/i, successMessage, deleteTooltip = "Eliminar" }) {
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

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes(endpointPattern) && res.request().method() === "DELETE" && res.status() === 200
    ),
    confirmButton.click({ force: true }),
  ]);

  if (successMessage) {
    await expect(page.locator(".v-snackbar").filter({ hasText: successMessage }).first()).toBeVisible();
  }
}

export async function saveFormAndVerify(page, { endpointPattern, successMessage }) {
  const saveButton = page.getByRole("button", { name: /^Guardar$/i }).first();
  await expect(saveButton).toBeVisible();

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes(endpointPattern) && 
               res.request().method() === "POST" && 
               [200, 201].includes(res.status())
    ),
    saveButton.click(),
  ]);

  if (successMessage) {
    await expect(page.locator(".v-snackbar").filter({ hasText: successMessage }).first()).toBeVisible();
  } else {
    await expect(page.locator(".v-snackbar").first()).toBeVisible();
  }
}

export async function verifyRecordInList(page, { searchName }) {
  await searchInList(page, searchName);
  const matchingRow = page.locator(".v-data-table__tr").filter({ hasText: searchName }).first();
  await expect(matchingRow).toBeVisible();
}

export async function clickTableRowAction(page, rowLocator, tooltipText) {
  const actionsCell = rowLocator.locator("td").last();

  const isSpeedDial = await actionsCell.locator(".speed-dial-container").count() > 0;
  if (isSpeedDial) {
    const speedDialTrigger = actionsCell.locator("button.v-btn").last();
    await speedDialTrigger.click({ force: true });
    await page.waitForTimeout(300);
  }

  const buttons = await actionsCell.locator("button.v-btn").all();
  const foundTooltips = [];

  for (const btn of buttons) {
    if (await btn.isDisabled()) continue;

    await btn.hover({ force: true });

    const tooltip = page
      .locator(".v-overlay__content")
      .filter({ hasText: tooltipText })
      .first();

    try {
      await tooltip.waitFor({ state: "visible", timeout: 800 });
      await btn.click({ force: true });
      return;
    } catch {
      const anyTooltip = page.locator(".v-overlay__content").first();
      try {
        const text = await anyTooltip.innerText({ timeout: 400 });
        if (text.trim()) foundTooltips.push(text.trim());
      } catch {
      }
      continue;
    }
  }

  throw new Error(
    `No action button with tooltip "${tooltipText}" found in the row. ` +
    `Tooltips found: ${foundTooltips.length ? foundTooltips.join(", ") : "none"}.`
  );
}

export async function ensureCleanRecord(page, {
  listPath,
  addPath,
  name,
  fillForm,
  endpointPattern,
  successMessage,
  confirmButtonRegex,
  deleteSuccessMessage,
  deleteTooltip,
}) {
  await page.goto(listPath);
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern,
    confirmButtonRegex,
    successMessage: deleteSuccessMessage,
    deleteTooltip,
  });

  await page.goto(addPath);
  await fillForm(page);

  await saveFormAndVerify(page, { endpointPattern, successMessage });

  await page.goto(listPath);
  await verifyRecordInList(page, { searchName: name });
}