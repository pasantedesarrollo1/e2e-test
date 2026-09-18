import { expect, type Page } from "@playwright/test";

/**
 * Valid login mode options.
 */
export type LoginMode = "cached" | "fresh" | (string & {});

/**
 * Valid cash register mode options.
 */
export type CashRegisterMode = "ensure-closed" | "ensure-open" | (string & {});

/**
 * Verifies that the POS (Point of Sale) context is fully loaded.
 * 
 * @param page - The Playwright Page instance
 * @param loginMode - The login mode ("cached" or "fresh")
 * @param cashRegisterMode - The cash register mode ("ensure-closed" or "ensure-open")
 * @returns A promise resolving when the UI is loaded
 */
export async function verifyPosContextLoaded(
    page: Page, 
    loginMode: LoginMode, 
    cashRegisterMode?: CashRegisterMode
): Promise<void> {
    const homeIndicator = page.getByText(/Cliente:/i).first();
    const closedIndicator = page.getByRole("button", { name: /Abrir Caja/i }).first();
    const targetIndicator = cashRegisterMode === "ensure-closed" ? closedIndicator : homeIndicator;

    if (loginMode === "cached") {
        await expect(targetIndicator).toBeVisible({ timeout: 60_000 });
    } else {
        await expect(targetIndicator).toBeVisible({ timeout: 15_000 });
    }
}

/**
 * Verifies that the Admin context is fully loaded.
 * 
 * @param page - The Playwright Page instance
 * @param loginMode - The login mode ("cached" or "fresh")
 * @returns A promise resolving when the admin UI is loaded
 */
export async function verifyAdminContextLoaded(
    page: Page, 
    loginMode: LoginMode
): Promise<void> {
    const adminMenuIndicator = page.locator(".v-navigation-drawer, .v-app-bar").first();
    
    if (loginMode === "cached") {
        await expect(adminMenuIndicator).toBeVisible({ timeout: 60_000 });
    } else {
        await expect(adminMenuIndicator).toBeVisible({ timeout: 15_000 });
    }
}
