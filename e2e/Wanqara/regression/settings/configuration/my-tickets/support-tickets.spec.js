import { test, expect } from "@playwright/test";
import { annotateTicket } from "../../../../harness/annotate.js";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { ensureAuthenticated, getSessionPath } from "../../../../harness/auth.js";
import { selectDropdownOption } from "../../../../harness/ui-helpers.js";
import { searchInList } from "../../../../harness/crud-helpers.js";

const TICKET = {
  ws: 'WS-986',
  tes: 'TES-210',
  release: 'v7.9.1',
  summary: 'Support Tickets Search',
  addedToRegression: 'true',
};

async function navigateToCreateTicket(page, tenantBaseUrl) {
  await ensureAuthenticated(page, {
    tenantBaseUrl,
    targetPath: "/admin/support/tickets/list",
    authType: "retail",
  });
  await page.getByRole("link", { name: /Crear Ticket/i }).click();
  await expect(page).toHaveURL(/\/admin\/support\/tickets\/create/);
}

async function selectFirstCategory(page) {
  const categoryCard = page.locator(".v-card").first();
  await expect(categoryCard).toBeVisible({ timeout: 10_000 });
  await categoryCard.click();
}

async function clickSiguiente(page) {
  const siguienteBtn = page.getByRole("button", { name: /Siguiente/i });
  await expect(siguienteBtn).toBeEnabled({ timeout: 10_000 });
  await siguienteBtn.click();
}

async function selectFirstService(page) {
  const serviceSelect = page.locator(".v-field").filter({ has: page.locator("input[placeholder='Selecciona un servicio']") }).first();
  await expect(serviceSelect).toBeVisible({ timeout: 10_000 });
  await selectDropdownOption(page, { triggerLocator: serviceSelect });
}

async function selectFirstDateAndSlot(page) {
  const dateField = page.getByRole("textbox", { name: /Seleccionar fecha y horario/i });
  await expect(dateField).toBeVisible();
  await dateField.click();

  const dialog = page
    .locator(".v-dialog")
    .filter({ hasText: /Selecciona la fecha y horario/i })
    .first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  const targetDate = new Date();
  const currentMonth = targetDate.getMonth();

  if (targetDate.getDay() === 6) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (targetDate.getDay() === 0) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  if (targetDate.getMonth() !== currentMonth) {
    const nextMonthBtn = dialog.locator("button").filter({ has: page.locator(".mdi-chevron-right") }).first();
    if (await nextMonthBtn.isVisible()) {
      await nextMonthBtn.click();
    }
  }

  const targetDayString = targetDate.getDate().toString();
  const dayButton = dialog
    .locator(".v-date-picker-month__day:not(.v-date-picker-month__day--outside) button:not([disabled])")
    .filter({ hasText: new RegExp(`^${targetDayString}$`) })
    .first();
    
  await expect(dayButton).toBeVisible({ timeout: 10_000 });
  await dayButton.click();

  const firstSlot = dialog.getByRole("button").filter({ hasText: /^\d{1,2}:\d{2}/ }).first();
  await expect(firstSlot).toBeVisible({ timeout: 10_000 });
  await firstSlot.click();

  await expect(dialog).not.toBeVisible({ timeout: 5_000 });
}

async function fillWhatsapp(page, number = "999999999") {
  const whatsappInput = page.locator("#whatsapp");
  await expect(whatsappInput).toBeVisible();
  await whatsappInput.fill(number);
}

async function fillObservation(page, text = "test automatizado") {
  const textarea = page.locator("#observation");
  await expect(textarea).toBeVisible();
  await textarea.fill(text);
}

async function acceptTerms(page) {
  const checkbox = page.getByRole("checkbox", {
    name: /Acepto los Términos y Condiciones/i,
  });
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
}

async function checkFormFilledCorrectly(page) {
  const agendarBtn = page.getByRole("button", { name: /Agendar/i });
  await expect(agendarBtn).toBeEnabled({ timeout: 5_000 });
}

test.describe("Support Tickets — Create @regression", () => {
  requirePosCredentials(test);

  test("successfully fills the support ticket form selecting the first available category, service, and time slot", async ({ page }) => {
    test.setTimeout(120_000);
    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to the support tickets list and open the create form", async () => {
      await navigateToCreateTicket(page, tenantBaseUrl);
    });

    await test.step("Select the first available category", async () => {
      await selectFirstCategory(page);
    });

    await test.step("Advance to the ticket form", async () => {
      await clickSiguiente(page);
    });

    await test.step("Select the first available service from the dropdown", async () => {
      await selectFirstService(page);
    });

    await test.step("Select the first available date and time slot", async () => {
      await selectFirstDateAndSlot(page);
    });

    await test.step("Enter the WhatsApp contact number", async () => {
      await fillWhatsapp(page, "999999999");
    });

    await test.step("Describe the problem in the observation field", async () => {
      await fillObservation(page, "test automatizado");
    });

    await test.step("Accept the terms and conditions", async () => {
      await acceptTerms(page);
    });

    await test.step("Verify the form is filled correctly and ready to submit", async () => {
      await checkFormFilledCorrectly(page);
    });
  });
});

test.describe("Support Tickets — Search @regression", () => {
  annotateTicket(test, TICKET);
  requirePosCredentials(test);

  test.use({ storageState: getSessionPath("retail") });

  test("searches for a specific ticket ID and validates the API response and table data", async ({ page }) => {
    test.setTimeout(60_000);
    const searchId = "17902";
    const tenantBaseUrl = getTenantBaseUrl();

    await test.step("Navigate to the support tickets list", async () => {
      await ensureAuthenticated(page, {
        tenantBaseUrl,
        targetPath: "/admin/support/tickets/list",
        authType: "retail",
      });
    });

    await test.step("Execute search and validate API request", async () => {
      const searchResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/support/tickets") &&
          res.url().includes(searchId) &&
          res.request().method() === "GET" &&
          res.status() === 200
      );

      await searchInList(page, searchId);
      await searchResponsePromise;
    });

    await test.step("Verify the ticket code appears in the first column of the first row", async () => {
      const firstRow = page.locator(".v-data-table__tr").first();
      await expect(firstRow).toBeVisible();

      const firstColumn = firstRow.locator("td").first();
      await expect(firstColumn).toContainText(searchId);
    });
  });
});