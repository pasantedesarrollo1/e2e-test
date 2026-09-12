import os
import re

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-quotations.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-quotations.json"), "utf-8")
);
"""

content = content.replace('import { SEED } from "../../../harness/config/seed.js";\n', '')
content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

# Update runQuoteFlow signature and implementation
content = content.replace(
'''async function runQuoteFlow(page, { homePath, observacion, paymentTerms, pdfChoice }) {
  await page.goto(withPath(getTenantBaseUrl(), homePath));
  await page.waitForURL(new RegExp(homePath));

  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await page.getByPlaceholder("Ingresa Cdula o RUC").clear();

  await selectClientByCedula(page, SEED.clients.consumidorFinal.cedula);
  await searchAndSelectProduct(page, { name: SEED.products.estandar.name });''',
'''async function runQuoteFlow(page, { homePath, quoteParams, pdfChoice }) {
  await page.goto(withPath(getTenantBaseUrl(), homePath));
  await page.waitForURL(new RegExp(homePath));

  await expect(page.getByText(/Cliente:/i)).toBeVisible();
  await page.getByPlaceholder("Ingresa Cédula o RUC").clear();

  await selectClientByCedula(page, quoteParams.clientCedula);
  await searchAndSelectProduct(page, { name: quoteParams.productName });'''
)

# Update observacion and paymentTerms in runQuoteFlow
content = content.replace(
'''  await quoteModal.locator("textarea").nth(0).fill(observacion);
  await quoteModal.locator("textarea").nth(1).fill(paymentTerms);''',
'''  await quoteModal.locator("textarea").nth(0).fill(quoteParams.observation);
  await quoteModal.locator("textarea").nth(1).fill(quoteParams.paymentTerms);'''
)

# Remove environments and replace the loop
content = re.sub(r'const environments = \[\s+.*?\];\n\nfor \(const env of environments\) \{', 
'''for (const scenario of scenarios) {
  test.describe.serial(`POS ${scenario.description} - Quotation Workflow @${scenario.metadata?.testScope || 'regression'}`, () => {
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(scenario.authType) });

    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }

    const runTest = (title, bodyFn) => {
      if (scenario.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };''', content, flags=re.DOTALL)

# Update runQuoteFlow calls
content = content.replace(
'''        await runQuoteFlow(page, {
          homePath: env.homePath,
          observacion: SEED.sale.quoteObservation,
          paymentTerms: SEED.sale.quotePaymentTerms,
          pdfChoice: null,
        });''',
'''        await runQuoteFlow(page, {
          homePath: scenario.homePath,
          quoteParams: scenario.quoteParams,
          pdfChoice: null,
        });'''
)

content = content.replace(
'''        await runQuoteFlow(page, {
          homePath: env.homePath,
          observacion: SEED.sale.quoteObservation,
          paymentTerms: SEED.sale.quotePaymentTerms,
          pdfChoice: "No mostrar PDF",
        });''',
'''        await runQuoteFlow(page, {
          homePath: scenario.homePath,
          quoteParams: scenario.quoteParams,
          pdfChoice: "No mostrar PDF",
        });'''
)

# Fix paymentUrl
content = content.replace('await page.waitForURL(env.paymentUrl);', 'await page.waitForURL(new RegExp(scenario.paymentUrlPattern));')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
