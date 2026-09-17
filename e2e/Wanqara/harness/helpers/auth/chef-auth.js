import { clickAndWaitForApi, formatChefSubsidiary } from "../ui/ui-helpers.js";
import fs from "node:fs";
import { expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chefHarness } from "../../config/settings.js";
export const CHEF_AUTH_PATH = /\/auth\//;

export const getChefSessionPath = (chefAuthType = "actor1") => path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  `../../.auth/chef-${chefAuthType}-session.json`
);

export async function loginChef(page, { chefBaseUrl, login, subsidiary, subsidiaryCode }) {
  if (!subsidiary || !subsidiaryCode) throw new Error("loginChef requires subsidiary and subsidiaryCode parameters from JSON");
  const formattedSubsidiary = formatChefSubsidiary(subsidiary, subsidiaryCode);
  const url = chefBaseUrl ? new URL("/auth/ruc", chefBaseUrl).toString() : "/auth/ruc";
  await page.goto(url);

  await page.getByRole("button", { name: /Soy cliente de Wanqara/i }).click();

  await page.getByPlaceholder(/Ingrese el dominio/i).fill(login.ruc);

  await clickAndWaitForApi(page, page.getByRole("button", { name: /Verificar/i }), {
    endpoint: "/api/v1/tenants/verify-ruc",
    method: "GET",
    status: 200
  });

  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByPlaceholder(/email@domain.com/i).fill(login.email);
  await page.getByPlaceholder(/Contraseña/i).fill(login.password);

  await clickAndWaitForApi(page, page.getByRole("button", { name: /Iniciar Sesión/i }), {
    endpoint: "/api/v1/apps/orders/login",
    method: "POST",
    status: 200
  });

  await expect(page).toHaveURL(/\/config\/user-onboarding/);

  await page
      .locator("div")
      .filter({ hasText: new RegExp(`^${formattedSubsidiary}$`, 'i') })
      .nth(5)
      .click();

  await page.getByRole("button", { name: /Omitir/i }).first().click();

  const skipModal = page.getByRole("heading", { name: /Omitir configuración/i });
  await expect(skipModal).toBeVisible();

  await clickAndWaitForApi(page, page.getByRole("button", { name: /Omitir/i }).last(), {
    endpoint: "/api/v1/general/users/update-logged-user-settings",
    method: "PUT",
    status: 200
  });

  await expect(page).toHaveURL(/\/tables/);
}

export async function ensureChefAuthenticated(page, { chefBaseUrl, targetPath, login, subsidiary, subsidiaryCode, chefAuthType = "actor1" }) {
  const effectiveLogin = login || chefHarness.users[chefAuthType];
  
  const defaultBranches = JSON.parse(
    fs.readFileSync(path.resolve(path.dirname(getChefSessionPath(chefAuthType)), "../config/default-branches.json"), "utf-8")
  );

  const effectiveSubsidiary = subsidiary || defaultBranches[chefAuthType]?.name;
  const effectiveSubsidiaryCode = subsidiaryCode || defaultBranches[chefAuthType]?.code;
  
  if (!effectiveSubsidiary || !effectiveSubsidiaryCode) throw new Error(`ensureChefAuthenticated requires subsidiary and subsidiaryCode parameters for ${chefAuthType}`);

  const url = chefBaseUrl ? new URL(targetPath, chefBaseUrl).toString() : targetPath;
  await page.goto(url);

  const isOnAuth = await page.waitForURL(CHEF_AUTH_PATH, { timeout: 3000 }).then(() => true).catch(() => false);
  
  if (!isOnAuth) {
    await page.waitForURL((current) => !CHEF_AUTH_PATH.test(current.pathname), { timeout: 5000 });
    return;
  }

  await loginChef(page, {
    chefBaseUrl,
    login: effectiveLogin,
    subsidiary: effectiveSubsidiary,
    subsidiaryCode: effectiveSubsidiaryCode
  });

  const defaultLogin = chefHarness.users[chefAuthType];
  const isDefaultLogin = defaultLogin && effectiveLogin.ruc === defaultLogin.ruc && effectiveLogin.email === defaultLogin.email;
  // Solo se guarda sesión compartida si no se envían logins quemados custom (si es el login principal de chef)
  if (isDefaultLogin) {
    await page.context().storageState({ path: getChefSessionPath(chefAuthType) });
  }

  await page.goto(url);
  await page.waitForURL((current) => !CHEF_AUTH_PATH.test(current.pathname));
}
