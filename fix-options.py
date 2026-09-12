import os, re
path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-options.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add json import
import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-options.json"), "utf-8")
);
"""

# Replace the environments array and the loop with scenarios
content = re.sub(r'const environments = \[.*?\];\n\nfor \(const env of environments\) \{', 'for (const scenario of scenarios) {\n  const env = scenario;', content, flags=re.DOTALL)
content = content.replace('test.describe(`POS ${env.name} - Sale Options @regression`, () => {', 'test.describe(`POS ${scenario.description} - Sale Options @${scenario.metadata.testScope}`, () => {')

content = content.replace('import { SEED } from "../../../harness/config/seed.js";\n', '')
content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

# Use regex to replace annotateTicket call which is missing currently
content = content.replace(
'''    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(env.authType) });''',
'''    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(scenario.authType) });
    
    if (scenario.metadata && scenario.metadata.ws) {
      import("../../../harness/helpers/annotate.js").then(({ annotateTicket }) => {
         annotateTicket(test, scenario.metadata);
      }).catch(() => {});
    }'''
)


content = content.replace('SEED.products.estandar.name', 'scenario.optionsParams.productName')
content = content.replace('SEED.sale.observationText', 'scenario.optionsParams.observationText')
content = content.replace('SEED.sale.savedSaleAlias', 'scenario.optionsParams.savedSaleAlias')

# Fix paymentUrl in waiting since it's a regex in the original code, but a string in the JSON
content = content.replace('await page.waitForURL(env.paymentUrl);', 'await page.waitForURL(new RegExp(scenario.paymentUrlPattern));')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
