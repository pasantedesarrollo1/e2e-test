import os
import re

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'common', 'sale-with-client.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { annotateTicket } from "../../../harness/helpers/annotate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "sale-with-client.json"), "utf-8")
);
"""

# Remove SEED
content = content.replace('import { SEED } from "../../../harness/config/seed.js";\n', '')
content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

# Replace environments loop
content = re.sub(r'const environments = \[\s+.*?\];\n\nfor \(const env of environments\) \{',
'''for (const scenario of scenarios) {
  test.describe(`POS ${scenario.description} - Sales with Customer Assignment @${scenario.metadata?.testScope || 'regression'}`, () => {
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

# Replace SEED values inside the file
content = content.replace('SEED.clients.test.cedula', 'scenario.clientParams.testCedula')
content = content.replace('SEED.clients.test.name', 'scenario.clientParams.testName')
content = content.replace('SEED.clients.consumidorFinal.cedula', 'scenario.clientParams.consumidorFinalCedula')
content = content.replace('SEED.products.estandar.name', 'scenario.clientParams.productName')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
