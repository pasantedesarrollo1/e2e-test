import { expect } from "@playwright/test";

export async function verifyPosContextLoaded(page, loginMode, cashRegisterMode) {
    const homeIndicator = page.getByText(/Cliente:/i).first();
    const closedIndicator = page.getByRole("button", { name: /Abrir Caja/i }).first();
    const targetIndicator = cashRegisterMode === "ensure-closed" ? closedIndicator : homeIndicator;

    if (loginMode === "cached") {
        await expect(targetIndicator).toBeVisible({ timeout: 60_000 });
    } else {
        await expect(targetIndicator).toBeVisible({ timeout: 15_000 });
    }
}

export async function verifyAdminContextLoaded(page, loginMode) {
    const adminMenuIndicator = page.locator(".v-navigation-drawer, .v-app-bar").first();
    if (loginMode === "cached") {
        await expect(adminMenuIndicator).toBeVisible({ timeout: 60_000 });
    } else {
        await expect(adminMenuIndicator).toBeVisible({ timeout: 15_000 });
    }
}
