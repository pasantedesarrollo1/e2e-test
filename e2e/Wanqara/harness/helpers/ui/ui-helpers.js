import { expect } from "@playwright/test";

export function formatPosSubsidiary(name, code) {
  if (!code) return name;
  return `${name} ${code}`;
}

export function formatChefSubsidiary(name, code) {
  if (!code) return name;
  return `${code} - ${name}`;
}

export async function selectDropdownOption(page, {
  triggerLocator,
  optionText = null,
  timeout = 3000,
  retryTimeout = 5000
}) {
  await triggerLocator.scrollIntoViewIfNeeded();
  await triggerLocator.click({ delay: 100 });

  const activeOverlay = page.locator(".v-overlay-container .v-overlay--active").last();
  
  const option = optionText
    ? activeOverlay.locator('[role="option"]').filter({ hasText: new RegExp(optionText, "i") }).first()
    : activeOverlay.locator('[role="option"]').first();

  try {
    await option.waitFor({ state: "visible", timeout });
  } catch {
    await triggerLocator.click({ force: true, delay: 100 });
    await option.waitFor({ state: "visible", timeout: retryTimeout });
  }

  await option.click();
  
  await expect(option).not.toBeVisible({ timeout: 5000 });
}

export async function expectSnackbar(page, messageRegex, timeout = 15000) {
  const snackbar = messageRegex
    ? page.locator(".v-snackbar").filter({ hasText: messageRegex }).last()
    : page.locator(".v-snackbar").last();
    
  await expect(snackbar).toBeVisible({ timeout });
}

/**
 * Patrón Indirection (GRASP): Abstrae la sincronización entre un click en la UI y la respuesta del backend.
 * 
 * @param {import('@playwright/test').Page} page - El objeto page de Playwright.
 * @param {import('@playwright/test').Locator} locator - El elemento interactuable (botón, link, etc) al que hacer click.
 * @param {Object} apiConfig - Configuración de la API esperada.
 * @param {string|RegExp} apiConfig.endpoint - Segmento de la URL o RegExp esperado.
 * @param {string} [apiConfig.method='POST'] - Método HTTP esperado (POST, GET, PATCH, DELETE).
 * @param {number|number[]} [apiConfig.status=200] - Código(s) de estado HTTP esperado(s).
 * @returns {Promise<import('@playwright/test').Response>} La respuesta del backend capturada.
 */
export async function clickAndWaitForApi(page, locator, { endpoint, method = 'POST', status = 200 }) {
  const [response] = await Promise.all([
    page.waitForResponse(res => {
      const urlMatches = typeof endpoint === 'string' ? res.url().includes(endpoint) : endpoint.test(res.url());
      const statusMatches = Array.isArray(status) ? status.includes(res.status()) : res.status() === status;
      return urlMatches && res.request().method() === method && statusMatches;
    }),
    locator.click({ force: true })
  ]);
  return response;
}
