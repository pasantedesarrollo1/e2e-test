import os
import re

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-product-options.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old environments array
content = re.sub(r'const environments = \[\s+.*?\];\n\n', '', content, flags=re.DOTALL)

# Replace the loop start
content = content.replace(
'''for (const env of environments) {
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

# And fix paymentUrl logic
content = content.replace('await page.waitForURL(env.paymentUrl);', 'await page.waitForURL(new RegExp(scenario.paymentUrlPattern));')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
