import { test, expect } from "@playwright/test";
import { requirePosCredentials, getTenantBaseUrl } from "../../../../harness/settings.js";
import { ensureAuthenticated } from "../../../../harness/auth.js";

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
  const serviceSelect = page
    .locator(".v-field")
    .filter({ has: page.locator("input[placeholder='Selecciona un servicio']") })
    .first();
  await expect(serviceSelect).toBeVisible({ timeout: 10_000 });
  await serviceSelect.click();

  const firstOption = page
    .locator(".v-overlay-container .v-overlay--active .v-list-item")
    .first();
  await expect(firstOption).toBeVisible({ timeout: 5_000 });
  await firstOption.click();
  await expect(firstOption).not.toBeVisible();
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

  const firstEnabledDay = dialog
    .locator('.v-date-picker-month__day:not(.v-date-picker-month__day--outside) button:not([disabled])')
    .first();
    
  await expect(firstEnabledDay).toBeVisible({ timeout: 10_000 });
  await firstEnabledDay.click();

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