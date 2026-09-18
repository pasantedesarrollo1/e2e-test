import { expect, type Page, type Locator } from "@playwright/test";
import { fillIdentityModal } from "@/e2e/Wanqara/harness/helpers/people/client-helpers.js";
import { expectSnackbar } from "@/e2e/Wanqara/harness/helpers/ui/ui-helpers.js";

export const DELIVERY_SEED = {
  phone: "0999999922",
  clientName: "Cliente Delivery Test",
  observation: "Observación de prueba automatizada",
  address: {
    name: "Casa Test",
    address: "Av. Principal 123",
    observation: "Timbre azul, segundo piso",
  },
};

export async function openDeliveryModal(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: /Delivery/i }).click();

  const modal = page.locator(".v-overlay__content").filter({ hasText: /Método de Entrega/i }).first();
  await expect(modal).toBeVisible();

  return modal;
}

export async function selectDeliveryMode(page: Page, modal: Locator): Promise<void> {
  const deliveryOption = modal.getByRole("button", { name: /Delivery\s+Envío a domicilio/i });
  await deliveryOption.click();
}

export interface DeliveryAddressStatus {
  form: Locator | null;
  isNew: boolean;
}

export async function ensureDeliveryPhoneAndAddress(page: Page, modal: Locator, phone: string): Promise<DeliveryAddressStatus> {
  const phoneInput = modal.getByRole("textbox", { name: /Teléfono/i });
  await expect(phoneInput).toBeVisible();

  const currentValue = await phoneInput.inputValue();

  if (currentValue !== phone) {
    await phoneInput.clear();
    await phoneInput.fill(phone);
  }

  const strip = modal.locator(".delivery-address-strip");
  await expect(strip).toBeVisible({ timeout: 15000 });

  const addressCard = strip.locator("button").filter({ hasNotText: /Nueva dirección/i }).first();
  const hasExistingAddress = await addressCard.isVisible();

  if (!hasExistingAddress) {
    const newAddressBtn = strip.locator("button").filter({ hasText: /Nueva dirección/i }).first();
    await newAddressBtn.click();

    const form = page.locator(".v-overlay__content").filter({ hasText: /Información de entrega/i }).first();
    await expect(form).toBeVisible();

    return { form, isNew: true };
  }

  return { form: null, isNew: false };
}

export interface DeliveryFormInfoOptions {
  clientName: string;
  observation?: string;
}

export async function fillDeliveryFormInfo(page: Page, form: Locator, { clientName, observation }: DeliveryFormInfoOptions): Promise<void> {
  await form.getByRole("textbox", { name: /Nombre del cliente/i }).fill(clientName);

  if (observation) {
    await form.getByRole("textbox", { name: /Observaciones generales/i }).fill(observation);
  }
}

export interface DeliveryClientOptions {
  cedula: string;
}

export async function addClientFromDeliveryForm(page: Page, form: Locator, { cedula }: DeliveryClientOptions): Promise<void> {
  const addClientBtn = form.getByRole("button", { name: /Crear o consultar cliente por/i });
  await addClientBtn.click();

  const clientModal = page.locator(".v-overlay__content").filter({ hasText: /Guardar Cliente/i }).first();
  await expect(clientModal).toBeVisible();

  await fillIdentityModal(page, clientModal, {
    identityType: "CEDULA",
    identityNumber: cedula
  });

  const saveBtn = clientModal.getByRole("button", { name: /Guardar Cliente/i });
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/pos/people") && res.request().method() === "GET" && res.status() === 200
    ),
    saveBtn.click({ force: true }),
  ]);

  await expectSnackbar(page, /Cliente creado correctamente/i);
}

export interface DeliveryAddressOptions {
  name: string;
  address: string;
  observation?: string;
}

export async function fillDeliveryAddress(page: Page, form: Locator, { name, address, observation }: DeliveryAddressOptions): Promise<void> {
  await form.getByRole("textbox", { name: /Nombre de la Dirección/i }).fill(name);
  await form.getByPlaceholder("Calle, número, piso").fill(address);

  if (observation) {
    await form.getByPlaceholder("Indicaciones adicionales").fill(observation);
  }
}

export async function saveDeliveryForm(page: Page): Promise<void> {
  const form = page.locator(".v-overlay__content").filter({ hasText: /Información de entrega/i }).first();
  const saveBtn = form.getByRole("button", { name: /^Guardar$/i });

  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/v1/restaurant/deliveries") && res.request().method() === "POST" && res.status() === 201
    ),
    saveBtn.click({ force: true }),
  ]);

  await expectSnackbar(page, /Creación exitosa/i);

  const closeBtn = form.locator(".v-card-title .v-btn").first();
  await closeBtn.click();
  await expect(form).toBeHidden();
}

export async function selectExistingDeliveryAddress(page: Page): Promise<void> {
  const strip = page.locator(".delivery-address-strip");
  const addressCard = strip.locator("button").filter({ hasNotText: /Nueva dirección/i }).first();
  await expect(addressCard).toBeVisible();
  await addressCard.click();
}

export async function saveDeliverySelection(page: Page): Promise<void> {
  const saveBtn = page.getByRole("button", { name: /^Guardar$/i }).filter({ has: page.locator(".mdi-content-save") });
  await saveBtn.click();
}

export async function verifyDeliveryConfirmed(page: Page): Promise<void> {
  await expect(
    page.locator(".panelContainer").filter({ hasText: /Delivery a domicilio/i }).first()
  ).toBeVisible();
}
