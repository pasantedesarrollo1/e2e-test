import { test, expect } from "@playwright/test";
import { generateDataDrivenTests } from "../../harness/helpers/test-generator.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "whatsapp-button.json"), "utf-8")
);

test.describe("Login - WhatsApp Button", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  generateDataDrivenTests(test, scenarios, (scenario) => {
    
    test(scenario.description, async ({ page }) => {
      await page.goto('/login');

      const page2Promise = page.waitForEvent('popup');
      
      await page.getByRole('button', { name: 'Contactar al Centro de Ayuda' }).click();
      
      const page2 = await page2Promise;

      await expect(page2.getByText('Chat on WhatsApp with')).toBeVisible({ timeout: 15000 });
      
    });

  });
});
