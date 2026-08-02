import { expect } from "@playwright/test";
import { SEED } from "../../harness/seed.js";
import { withPath } from "../../harness/urls.js";
import { ensureAuthenticated } from "../../harness/auth.js";
import { completePayment } from "./pos-payment.js";
import { searchAndSelectProduct } from "./pos-search.js";

export async function runPosSaleFlow(page, {
  tenantBaseUrl,
  productName,
  searchTerm,
  documentType,
  skipNavigation,
  afterProductSelect,
  beforeFinish,
  paymentMethod = SEED.paymentMethods.efectivo,
  printTicket = false,
  openDrawer = false,
}) {
  if (!skipNavigation) {
    await ensureAuthenticated(page, { tenantBaseUrl, targetPath: "/pos/home" });
    await page.waitForURL(/\/pos\/home/);
  }

  if (documentType && documentType !== SEED.documentTypes.facturaElectronica) {
    const documentTypeSelect = page.locator(".v-select").filter({
      hasText: /Factura|Recibo|Tipo de documento/i,
    }).first();
    await documentTypeSelect.click();

    const option = page.getByRole("option", { name: documentType, exact: true });
    await option.click();
  }

  await searchAndSelectProduct(page, { name: productName, searchTerm });

  if (afterProductSelect) await afterProductSelect(page);
  if (beforeFinish) await beforeFinish(page);

  const finishSaleButton = page.getByRole("button", { name: /Terminar Venta/i });
  await finishSaleButton.click({ force: true });

  await page.waitForURL(/\/pos\/(restaurant-)?payments/);

  await completePayment(page, { paymentMethod, printTicket, openDrawer });
}

export async function captureSaleMutation(page) {
  return page.waitForRequest(
    (req) =>
      req.method() === "POST" &&
      /\/pos\/sales(\/restaurant)?$/.test(new URL(req.url()).pathname.replace(/\/$/, "")),
    { timeout: 30000 },
  );
}

export async function selectClientByCedula(page, cedula) {
  const cedulaInput = page.getByPlaceholder("Ingresa Cédula o RUC").first();

  await cedulaInput.clear();
  await cedulaInput.fill(cedula);

  await expect(cedulaInput).toHaveValue(cedula);
  await cedulaInput.blur(); 
  await cedulaInput.focus();
  await cedulaInput.press("Enter");

  const clientModal = page.locator(".v-overlay__content").filter({
    has: page.getByRole("button", { name: /Guardar Cliente/i }),
  }).first();
  await expect(clientModal).toBeVisible();

  const guardarButton = clientModal.getByRole("button", { name: /Guardar Cliente/i });
  await expect(guardarButton).toBeEnabled();
  await guardarButton.click({ force: true });

  await expect(
    page.locator(".v-snackbar").filter({ hasText: /Cliente asignado correctamente/i }),
  ).toBeVisible({ timeout: 15000 });
}

export async function openDrawer(page, triggerLocator, filterText) {
  await triggerLocator.click();

  const drawer = page.locator(".v-navigation-drawer").filter({ hasText: filterText }).first();
  await expect(drawer).toBeVisible();

  return drawer;
}

export async function closeDrawer(page, filterText) {
  const drawer = page.locator(".v-navigation-drawer").filter({ hasText: filterText }).first();
  const closeBtn = drawer.locator(".v-btn--icon").filter({ has: page.locator(".mdi-close") }).first();

  await closeBtn.click();

  await expect(drawer).toHaveAttribute("inert", "");
}

export async function navigateToSavedSales(page, drawer) {
  const option = drawer
    .locator("button, .v-btn")
    .filter({ hasText: /Ventas Guardadas/i })
    .first();

  await option.click();

  await page.waitForURL(/\/pos\/saved-sales/);
}

export async function expandAndRecoverFirstSavedSale(page) {
  const recoverBtn = page.getByRole("button", { name: "Recuperar", exact: true }).first();
  await expect(recoverBtn).toBeVisible({ timeout: 10000 });
  await expect(recoverBtn).not.toHaveAttribute("aria-busy", "true");
  await recoverBtn.click();
  await page.waitForURL(/\/pos\/home/);
}