import os
import re

path = os.path.join('e2e', 'Wanqara', 'regression', 'POS', 'POS-C', 'stress-cart-duplication.spec.js')

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_json = """import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scenarios = JSON.parse(
  fs.readFileSync(path.join(__dirname, "0-json-data", "stress-cart-duplication.json"), "utf-8")
);
"""

# Remove SEED
content = content.replace('import { SEED } from "../../../harness/config/seed.js";\n', '')
content = content.replace('import { getSessionPath } from "../../../harness/helpers/auth.js";', 'import { getSessionPath } from "../../../harness/helpers/auth.js";\n' + import_json)

# Remove STRESS_TICKET
content = re.sub(r'const STRESS_TICKET = \{.*?\};\n', '', content, flags=re.DOTALL)

# Replace the describe block
new_loop = """for (const scenario of scenarios) {
  test.describe.serial(`POS - Product Selection Stress & Rapid-Click Testing @${scenario.metadata?.testScope || 'regression'} @release`, () => {
    
    if (scenario.metadata && scenario.metadata.ws) {
      annotateTicket(test, scenario.metadata);
    }
    
    requirePosCredentials(test);
    test.use({ storageState: getSessionPath(scenario.authType) });

    const runTest = (title, bodyFn) => {
      if (scenario.fixture === 'posPage') {
        test(title, async ({ posPage: page }) => await bodyFn(page));
      } else {
        test(title, async ({ posRestaurantPage: page }) => await bodyFn(page));
      }
    };

    runTest('should not duplicate cart rows or corrupt store state under rapid random clicks', async (page) => {
      test.setTimeout(120000); 
      const searchKeyword = scenario.searchKeyword;"""

content = re.sub(
r"test\.describe\.serial\('POS - Product Selection Stress & Rapid-Click Testing @regression @release', \(\) => \{\n  annotateTicket\(test, STRESS_TICKET\);\n  requirePosCredentials\(test\);\n  test\.use\(\{ storageState: getSessionPath\(\"retail\"\) \}\);\n\n  test\('should not duplicate cart rows or corrupt store state under rapid random clicks', async \(\{ posPage: page \}\) => \{\n    test\.setTimeout\(120000\); \n\n    const searchKeyword = SEED\.searchTerms\.alitas;",
new_loop, content)

content = content.replace("  });\n});\n", "    });\n  });\n}\n")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
