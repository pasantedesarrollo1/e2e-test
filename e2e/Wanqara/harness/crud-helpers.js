import { expect } from "@playwright/test";

export async function searchInList(page, searchName) {
  const searchField = page.getByRole("textbox", { name: /Busca lo que necesites|Buscar por Nombre/i }).first();
  await expect(searchField).toBeVisible();
  await searchField.fill(searchName);
}

export async function deleteRecordFromList(page, { searchName, endpointPattern, confirmButtonRegex = /^Aceptar$|^Confirmar$/i, successMessage }) {
  await searchInList(page, searchName);

  const noData = page.getByText("No hay datos disponibles");
  const matchingRow = page.locator(".v-data-table__tr").filter({ hasText: searchName }).first();

  await expect(noData.or(matchingRow)).toBeVisible();

  if (!(await matchingRow.isVisible())) {
    return;
  }

  const speedDialContainer = matchingRow.locator(".speed-dial-container");
  if (await speedDialContainer.isVisible()) {
    await speedDialContainer.getByRole("button").last().click();
  }

  const deleteButton = matchingRow.getByRole("button", { name: /Eliminar/i })
    .or(matchingRow.getByRole("button", { description: /Eliminar/i }))
    .or(matchingRow.locator("button").filter({ has: page.locator(".iconify--fluent") }).last())
    .or(matchingRow.locator("button").nth(1));

  await expect(deleteButton.first()).toBeVisible();
  await deleteButton.first().click();

  const confirmButton = page.getByRole("button", { name: confirmButtonRegex });
  await expect(confirmButton).toBeVisible();

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes(endpointPattern) && res.request().method() === "DELETE" && res.status() === 200
    ),
    confirmButton.click(),
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
  const buttons = await rowLocator.locator("button.v-btn").all();

  for (const btn of buttons) {
    await btn.hover();

    const tooltip = page
      .locator(".v-tooltip .v-overlay__content")
      .filter({ hasText: tooltipText })
      .first();

    try {
      await tooltip.waitFor({ state: "visible", timeout: 800 });
      await btn.click();
      return;
    } catch {
      continue;
    }
  }

  throw new Error(
    `No table action button with tooltip "${tooltipText}" found in the row.`,
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
}) {
  await page.goto(listPath);
  await deleteRecordFromList(page, {
    searchName: name,
    endpointPattern,
    confirmButtonRegex,
    successMessage: deleteSuccessMessage,
  });

  await page.goto(addPath);
  await fillForm(page);

  await saveFormAndVerify(page, { endpointPattern, successMessage });

  await page.goto(listPath);
  await verifyRecordInList(page, { searchName: name });
}