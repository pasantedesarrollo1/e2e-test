import { expect } from "@playwright/test";
import { expectSnackbar } from "../../../../harness/helpers/ui-helpers.js";

export async function selectOrderToChangeStatus(page) {
  const orderCard = page.locator(".tw-cursor-pointer.tw-group").first();
  await expect(orderCard).toBeVisible();
  await orderCard.click();
}

export async function processOrderStatusChange(page) {
  const changeStatusBtn = page.getByRole("button", { name: "Cambiar a Pendiente", exact: true });
  await expect(changeStatusBtn).toBeEnabled();
  await changeStatusBtn.click();

  const confirmBtn = page.getByRole("button", { name: "Confirmar Cambio", exact: true });
  await expect(confirmBtn).toBeVisible();

  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/pos/orders/") &&
      res.url().includes("/update-status") &&
      res.request().method() === "PATCH" &&
      res.status() === 200
  );

  await confirmBtn.click();
  await responsePromise;

  await expectSnackbar(page, /Estado de la orden actualizado con éxito/i);
}
