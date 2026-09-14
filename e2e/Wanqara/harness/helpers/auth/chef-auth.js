import { expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chefHarness } from "../../config/settings.js";
import { withPath } from "../../config/urls.js";

export const CHEF_AUTH_PATH = /\/auth\//;

export const CHEF_SESSION_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.auth/chef-session.json"
);

export async function loginChef(page, { chefBaseUrl, login, subsidiary = "001 - Wanqara" }) {
  await page.goto(withPath(chefBaseUrl, "/auth/ruc"));

  await page.getByRole("button", { name: /Soy cliente de Wanqara/i }).click();

  await page.getByPlaceholder(/Ingrese el dominio/i).fill(login.ruc);

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/tenants/verify-ruc") &&
        res.request().method() === "GET" &&
        res.status() === 200
    ),
    page.getByRole("button", { name: /Verificar/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByPlaceholder(/email@domain.com/i).fill(login.email);
  await page.getByPlaceholder(/Contraseña/i).fill(login.password);

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/apps/orders/login") &&
        res.request().method() === "POST" &&
        res.status() === 200
    ),
    page.getByRole("button", { name: /Iniciar Sesión/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/config\/user-onboarding/);

  await page
      .locator("div")
      .filter({ hasText: new RegExp(`^${subsidiary}$`, 'i') })
      .nth(5)
      .click();

  await page.getByRole("button", { name: /Omitir/i }).first().click();

  const skipModal = page.getByRole("heading", { name: /Omitir configuración/i });
  await expect(skipModal).toBeVisible();

  await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/general/users/update-logged-user-settings") &&
        res.request().method() === "PUT" &&
        res.status() === 200
    ),
    page.getByRole("button", { name: /Omitir/i }).last().click(),
  ]);

  await expect(page).toHaveURL(/\/tables/);
}

export async function ensureChefAuthenticated(page, { chefBaseUrl, targetPath, login, subsidiary }) {
  const effectiveLogin = login || chefHarness.login;
  const effectiveSubsidiary = subsidiary || "001 - Wanqara";

  const url = withPath(chefBaseUrl, targetPath);
  await page.goto(url);

  // Solo intentar re-login si realmente aterrizamos en auth
  const isOnAuth = await page.waitForURL(CHEF_AUTH_PATH, { timeout: 3000 }).then(() => true).catch(() => false);
  
  if (!isOnAuth) {
    // Ya estamos autenticados, verificar URL destino
    await page.waitForURL((current) => !CHEF_AUTH_PATH.test(current.pathname), { timeout: 5000 });
    return;
  }

  // Re-login real — propagar el error para que no se swallow
  await loginChef(page, {
    chefBaseUrl,
    login: effectiveLogin,
    subsidiary: effectiveSubsidiary,
  });

  const isDefaultLogin = effectiveLogin.ruc === chefHarness.login.ruc && effectiveLogin.email === chefHarness.login.email;
  const isDefaultSubsidiary = effectiveSubsidiary === "001 - Wanqara";
  if (isDefaultLogin && isDefaultSubsidiary) {
    await page.context().storageState({ path: CHEF_SESSION_PATH });
  }

  await page.goto(url);
  await page.waitForURL((current) => !CHEF_AUTH_PATH.test(current.pathname));
}
