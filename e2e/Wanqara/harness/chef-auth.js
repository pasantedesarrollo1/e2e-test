import { expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { withPath } from "./urls.js";
import { chefHarness, playwrightHarness } from "./settings.js";

export const CHEF_AUTH_PATH = /\/auth\//;

export const CHEF_SESSION_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.auth/chef-session.json"
);

export async function loginChef(page, { chefBaseUrl, login }) {
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
      .filter({ hasText: /^001 - Wanqara$/ })
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

export async function ensureChefAuthenticated(page, { chefBaseUrl, targetPath }) {
  if (fs.existsSync(CHEF_SESSION_PATH)) {
    const chefState = JSON.parse(fs.readFileSync(CHEF_SESSION_PATH, "utf-8"));
    
    if (chefState.cookies?.length) {
      await page.context().addCookies(chefState.cookies);
    }

    if (chefState.origins?.length) {
      await page.context().addInitScript((origins) => {
        for (const originData of origins) {
          if (window.location.origin === originData.origin) {
            for (const item of originData.localStorage) {
              window.localStorage.setItem(item.name, item.value);
            }
          }
        }
      }, chefState.origins);
    }
  }

  const url = withPath(chefBaseUrl, targetPath);
  await page.goto(url);

  try {
    await page.waitForURL(CHEF_AUTH_PATH, { timeout: 3000 });
    
    await loginChef(page, {
      chefBaseUrl,
      login: chefHarness.login,
    });
    
    await page.context().storageState({ path: CHEF_SESSION_PATH });
    
    await page.goto(url);
    await page.waitForURL((current) => !CHEF_AUTH_PATH.test(current.pathname));
  } catch {
  }
}