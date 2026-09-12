import os
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-product-options.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add JSON import
import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-product-options.json"), "utf-8")
);
"""

# Replace SEED import and getSessionPath
content = content.replace('import { SEED } from "../../../harness/config/seed.js";\n', '')
content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

# Update applyProductOptions to take optionsParams
content = content.replace(
'''async function applyProductOptions(page, { priceLabel, discountType }) {
  const dialog = await openProductOptions(page);
  await setQuantityInOptions(page, dialog, SEED.sale.productOptionsQuantity);
  await selectPriceType(page, dialog, priceLabel);
  await setUnitPriceInOptions(page, dialog, SEED.sale.productOptionsUnitPrice);
  await setDiscountInOptions(page, dialog, SEED.discount.rate, discountType);
  await saveProductOptions(page, dialog);
}''',
'''async function applyProductOptions(page, { priceLabel, discountType, optionsParams }) {
  const dialog = await openProductOptions(page);
  await setQuantityInOptions(page, dialog, optionsParams.quantity);
  await selectPriceType(page, dialog, priceLabel);
  await setUnitPriceInOptions(page, dialog, optionsParams.unitPrice);
  await setDiscountInOptions(page, dialog, optionsParams.discountRate, discountType);
  await saveProductOptions(page, dialog);
}'''
)

# Fix environments to scenarios
content = content.replace(
'''const environments = [
  { name: 'Retail',     authType: 'retail',     fixture: 'posPage',           paymentUrl: /\\/pos\\/payments/ },
  { name: 'Restaurant', authType: 'restaurant', fixture: 'posRestaurantPage', paymentUrl: /\\/pos\\/restaurant-payments/ }
];

for (const env of environments) {
  test.describe(`POS ${env.name} - Product Options @regression`, () => {
    requirePosCredentials(test);

    test.use({ storageState: getSessionPath(env.authType) });

    const runTest = (title, bodyFn) => {
      if (env.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };''',
'''for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Product Options @${scenario.metadata?.testScope || 'regression'}`, () => {
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
    };'''
)

content = content.replace('SEED.products.estandar.name', 'scenario.productName')
content = content.replace(
    'await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Porcentaje" });',
    'await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Porcentaje", optionsParams: scenario.productOptionsParams });'
)
content = content.replace(
    'await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Porcentaje" });',
    'await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Porcentaje", optionsParams: scenario.productOptionsParams });'
)
content = content.replace(
    'await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Fijo" });',
    'await applyProductOptions(page, { priceLabel: "Precio A", discountType: "Fijo", optionsParams: scenario.productOptionsParams });'
)
content = content.replace(
    'await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Fijo" });',
    'await applyProductOptions(page, { priceLabel: "Precio C", discountType: "Fijo", optionsParams: scenario.productOptionsParams });'
)
content = content.replace('await page.waitForURL(env.paymentUrl);', 'await page.waitForURL(new RegExp(scenario.paymentUrlPattern));')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
