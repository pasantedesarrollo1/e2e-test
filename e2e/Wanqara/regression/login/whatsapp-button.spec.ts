/* eslint-disable */
interface ScenarioData extends FlatScenario {}
import { test, expect } from "@/e2e/Wanqara/harness/fixtures/admin.fixture.js";
import { generateDataDrivenTests, type TestMetadata, type ScenarioDefinition, type FlatScenario } from "@/e2e/Wanqara/harness/helpers/test-generator.js";
import { parseScenarios } from "@/e2e/Wanqara/harness/helpers/schema/scenario-schema.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios: ScenarioData[] = JSON.parse(fs.readFileSync(path.join(__dirname, "0-json-data", "whatsapp-button.json"), "utf-8"));

test.describe("Login - WhatsApp Button", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  generateDataDrivenTests<ScenarioData, any>(test, scenarios, (scenario: ScenarioData) => {
    
    test(scenario.description, async ({ page }) => {
      await page.goto('/login');

      const page2Promise = page.waitForEvent('popup');
      
      await page.getByRole('button', { name: 'Contactar al Centro de Ayuda' }).click();
      
      const page2 = await page2Promise;

      await expect(page2.getByText('Chat on WhatsApp with')).toBeVisible({ timeout: 15000 });
      
    });

  });
});
