import { expect } from "@playwright/test";
import { ensureAuthenticated } from "../../../../../harness/helpers/auth.js";
import { selectDropdownOption } from "../../../../../harness/helpers/ui-helpers.js";

export async function navigateToCreateTicket(page, tenantBaseUrl, authType) {
  await ensureAuthenticated(page, {
    tenantBaseUrl,
    targetPath: "/admin/support/tickets/list",
    authType,
  });
  await page.getByRole("link", { name: /Crear Ticket/i }).click();
  await expect(page).toHaveURL(/\/admin\/support\/tickets\/create/);
}

export async function selectFirstCategory(page) {
  const categoryCard = page.locator(".v-card").first();
  await expect(categoryCard).toBeVisible({ timeout: 10_000 });
  await categoryCard.click();
}

export async function clickSiguiente(page) {
  const siguienteBtn = page.getByRole("button", { name: /Siguiente/i });
  await expect(siguienteBtn).toBeEnabled({ timeout: 10_000 });
  await siguienteBtn.click();
}

export async function selectFirstService(page) {
  const serviceSelect = page.locator(".v-field").filter({ has: page.locator("input[placeholder='Selecciona un servicio']") }).first();
  await expect(serviceSelect).toBeVisible({ timeout: 10_000 });
  await selectDropdownOption(page, { triggerLocator: serviceSelect });
}

export async function selectFirstDateAndSlot(page) {
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

export async function fillWhatsapp(page, number) {
  const whatsappInput = page.locator("#whatsapp");
  await expect(whatsappInput).toBeVisible();
  await whatsappInput.fill(number);
}

export async function fillObservation(page, text) {
  const textarea = page.locator("#observation");
  await expect(textarea).toBeVisible();
  await textarea.fill(text);
}

export async function acceptTerms(page) {
  // Manejamos el texto con regex para soportar tíldes u otros caracteres (Términos)
  const checkbox = page.getByRole("checkbox", {
    name: /Acepto los T.rminos y Condiciones/i,
  });
  await expect(checkbox).toBeVisible();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
}

export async function checkFormFilledCorrectly(page) {
  const agendarBtn = page.getByRole("button", { name: /Agendar/i });
  await expect(agendarBtn).toBeEnabled({ timeout: 5_000 });
}
